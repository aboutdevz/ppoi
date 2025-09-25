import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and, sql } from "drizzle-orm";
import * as schema from "../../db/schema";
import { nanoid } from "nanoid";

// Helper function to get image URL based on environment
function getImageUrl(c: { req: { url: string } }, r2Key: string): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}/v1/serve/${r2Key}`;
}

export const imagesRoute = new Hono<{ Bindings: Env }>();

const remixImageSchema = z.object({
  parentImageId: z.string(),
  prompt: z.string().min(1).max(1000),
  negativePrompt: z.string().max(500).optional(),
  quality: z.enum(["fast", "quality"]).default("fast"),
  guidance: z.number().min(1).max(30).default(7.5),
  steps: z.number().int().min(1).max(50).default(20),
  seed: z.number().int().min(0).max(2147483647).optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
  tags: z.array(z.string()).max(10).optional(),
  isPrivate: z.boolean().default(false),
});

// Serve images from R2 bucket
imagesRoute.get("/serve/*", async (c) => {
  try {
    // Extract path from URL - remove /v1/serve/ prefix
    const url = new URL(c.req.url);
    const fullPath = url.pathname;
    const path = fullPath.replace("/v1/serve/", "");

    if (!path) {
      return c.json({ error: "Image path required" }, 400);
    }

    // Get image from R2
    const object = await c.env.R2.get(path);

    if (!object) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "image/png",
    );
    headers.set("Cache-Control", "public, max-age=31536000"); // 1 year cache
    headers.set("ETag", object.httpEtag);

    if (object.size) {
      headers.set("Content-Length", object.size.toString());
    }

    return new Response(object.body as ReadableStream, { headers });
  } catch (error) {
    console.error("Image serve error:", error);
    return c.json({ error: "Failed to serve image" }, 500);
  }
});

// Get image details
imagesRoute.get("/images/:imageId", async (c) => {
  try {
    const imageId = c.req.param("imageId");
    const db = drizzle(c.env.DB, { schema });

    const images = await db
      .select({
        id: schema.images.id,
        userId: schema.images.userId,
        prompt: schema.images.prompt,
        negativePrompt: schema.images.negativePrompt,
        model: schema.images.model,
        guidance: schema.images.guidance,
        steps: schema.images.steps,
        seed: schema.images.seed,
        aspectRatio: schema.images.aspectRatio,
        width: schema.images.width,
        height: schema.images.height,
        r2Key: schema.images.r2Key,
        isPrivate: schema.images.isPrivate,
        parentId: schema.images.parentId,
        likeCount: schema.images.likeCount,
        commentCount: schema.images.commentCount,
        createdAt: schema.images.createdAt,
        userName: schema.users.name,
        userHandle: schema.users.handle,
        userImage: schema.users.image,
        isAnonymous: schema.users.isAnonymous,
      })
      .from(schema.images)
      .leftJoin(schema.users, eq(schema.images.userId, schema.users.id))
      .where(eq(schema.images.id, imageId))
      .limit(1);

    const image = images[0];
    if (!image) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Check if image is private and user has access
    const userId = c.req.header("X-PPOI-User");
    if (image.isPrivate && image.userId !== userId) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Get tags
    const imageTags = await db
      .select({
        name: schema.tags.name,
      })
      .from(schema.imageTags)
      .leftJoin(schema.tags, eq(schema.imageTags.tagId, schema.tags.id))
      .where(eq(schema.imageTags.imageId, imageId));

    const tags = imageTags.map((tag) => tag.name).filter(Boolean);

    // Check if current user has liked this image
    let isLiked = false;
    if (userId) {
      const likes = await db
        .select()
        .from(schema.likes)
        .where(
          and(
            eq(schema.likes.userId, userId),
            eq(schema.likes.imageId, imageId),
          ),
        )
        .limit(1);
      isLiked = likes.length > 0;
    }

    return c.json({
      image: {
        id: image.id,
        url: getImageUrl(c, image.r2Key),
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        model: image.model,
        guidance: image.guidance,
        steps: image.steps,
        seed: image.seed,
        aspectRatio: image.aspectRatio,
        width: image.width,
        height: image.height,
        isPrivate: image.isPrivate,
        parentId: image.parentId,
        likeCount: image.likeCount,
        commentCount: image.commentCount,
        createdAt: image.createdAt,
        tags,
        isLiked,
        user: {
          id: image.userId,
          name: image.userName,
          handle: image.userHandle,
          image: image.userImage,
          isAnonymous: image.isAnonymous,
        },
      },
    });
  } catch (error) {
    console.error("Get image error:", error);
    return c.json({ error: "Failed to fetch image" }, 500);
  }
});

// Remix/regenerate an image
imagesRoute.post(
  "/images/remix",
  zValidator("json", remixImageSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const userId = c.req.header("X-PPOI-User");
      const db = drizzle(c.env.DB, { schema });

      if (!userId) {
        return c.json({ error: "Authentication required" }, 401);
      }

      // Verify parent image exists and is accessible
      const parentImages = await db
        .select()
        .from(schema.images)
        .where(eq(schema.images.id, data.parentImageId))
        .limit(1);

      const parentImage = parentImages[0];
      if (!parentImage) {
        return c.json({ error: "Parent image not found" }, 404);
      }

      if (parentImage.isPrivate && parentImage.userId !== userId) {
        return c.json({ error: "Parent image not accessible" }, 403);
      }

      // Rate limiting (same as generate endpoint)
      const clientIp = c.req.header("CF-Connecting-IP") || "unknown";
      const userAgent = c.req.header("User-Agent") || "unknown";

      // Create generation job for remix
      const jobId = nanoid();
      const aspectRatioDimensions = {
        "1:1": { width: 1024, height: 1024 },
        "16:9": { width: 1344, height: 768 },
        "9:16": { width: 768, height: 1344 },
        "4:3": { width: 1152, height: 896 },
        "3:4": { width: 896, height: 1152 },
      };

      const dimensions = aspectRatioDimensions[data.aspectRatio];

      const generationJob: schema.NewGenerationJob = {
        id: jobId,
        userId: userId,
        prompt: data.prompt,
        negativePrompt: data.negativePrompt || null,
        quality: data.quality,
        guidance: data.guidance,
        steps: data.steps,
        seed: data.seed || null,
        aspectRatio: data.aspectRatio,
        width: dimensions.width,
        height: dimensions.height,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        isPrivate: data.isPrivate,
        status: "pending",
        error: null,
        resultImageId: null,
        clientIp: clientIp,
        userAgent: userAgent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert(schema.generationJobs).values(generationJob);

      // Start async image generation with parentId reference
      c.executionCtx.waitUntil(
        processRemixGenerationJob(c.env, jobId, data.parentImageId),
      );

      return c.json({
        jobId,
        status: "pending",
        message:
          "Remix generation started. Check status with /generate/status/:jobId",
        parentImageId: data.parentImageId,
      });
    } catch (error) {
      console.error("Remix error:", error);
      return c.json({ error: "Failed to start remix" }, 500);
    }
  },
);

// Get user's images
imagesRoute.get("/user/:userId", async (c) => {
  try {
    const targetUserId = c.req.param("userId");
    const currentUserId = c.req.header("X-PPOI-User");
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const db = drizzle(c.env.DB, { schema });

    // Build where conditions
    const conditions = [eq(schema.images.userId, targetUserId)];

    // Only show public images unless it's the user's own profile
    if (currentUserId !== targetUserId) {
      conditions.push(eq(schema.images.isPrivate, false));
    }

    const images = await db
      .select({
        id: schema.images.id,
        prompt: schema.images.prompt,
        model: schema.images.model,
        aspectRatio: schema.images.aspectRatio,
        width: schema.images.width,
        height: schema.images.height,
        r2Key: schema.images.r2Key,
        isPrivate: schema.images.isPrivate,
        likeCount: schema.images.likeCount,
        commentCount: schema.images.commentCount,
        createdAt: schema.images.createdAt,
      })
      .from(schema.images)
      .where(and(...conditions))
      .orderBy(desc(schema.images.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedImages = images.map((image) => ({
      id: image.id,
      url: getImageUrl(c, image.r2Key),
      prompt: image.prompt,
      model: image.model,
      aspectRatio: image.aspectRatio,
      width: image.width,
      height: image.height,
      isPrivate: image.isPrivate,
      likeCount: image.likeCount,
      commentCount: image.commentCount,
      createdAt: image.createdAt,
    }));

    return c.json({
      images: formattedImages,
      pagination: {
        page,
        limit,
        hasNext: images.length === limit,
      },
    });
  } catch (error) {
    console.error("Get user images error:", error);
    return c.json({ error: "Failed to fetch user images" }, 500);
  }
});

// Delete image
imagesRoute.delete("/images/:imageId", async (c) => {
  try {
    const imageId = c.req.param("imageId");
    const userId = c.req.header("X-PPOI-User");

    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const db = drizzle(c.env.DB, { schema });

    // Verify ownership
    const images = await db
      .select()
      .from(schema.images)
      .where(eq(schema.images.id, imageId))
      .limit(1);

    const image = images[0];
    if (!image) {
      return c.json({ error: "Image not found" }, 404);
    }

    if (image.userId !== userId) {
      return c.json({ error: "Not authorized" }, 403);
    }

    // Delete from R2
    try {
      await c.env.R2.delete(image.r2Key);
    } catch (error) {
      console.warn("Failed to delete from R2:", error);
    }

    // Delete from database (cascading will handle related records)
    await db.delete(schema.images).where(eq(schema.images.id, imageId));

    // Update user image count
    await db
      .update(schema.users)
      .set({
        imageCount: sql`${schema.users.imageCount} - 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, userId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    return c.json({ error: "Failed to delete image" }, 500);
  }
});

// Process remix generation job (background task)
async function processRemixGenerationJob(
  env: Env,
  jobId: string,
  parentImageId: string,
): Promise<void> {
  const db = drizzle(env.DB, { schema });

  try {
    // Update job status to processing
    await db
      .update(schema.generationJobs)
      .set({
        status: "processing",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.generationJobs.id, jobId));

    // Fetch job details
    const jobs = await db
      .select()
      .from(schema.generationJobs)
      .where(eq(schema.generationJobs.id, jobId))
      .limit(1);

    const job = jobs[0];
    if (!job) {
      throw new Error("Job not found");
    }

    // Prepare AI model input
    const modelName =
      job.quality === "quality"
        ? env.IMAGE_MODEL_QUALITY
        : env.IMAGE_MODEL_FAST;

    const aiInput = {
      prompt: job.prompt,
      ...(job.negativePrompt && { negative_prompt: job.negativePrompt }),
      guidance: job.guidance,
      num_steps: job.steps,
      ...(job.seed && { seed: job.seed }),
      width: job.width,
      height: job.height,
    };

    // Generate image with Cloudflare AI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await env.AI.run(modelName as any, aiInput);

    if (!response || typeof response !== "object" || !("image" in response)) {
      throw new Error("Invalid AI response format");
    }

    const imageData = response.image as unknown as ReadableStream;
    const buffer = await streamToBuffer(imageData);

    // Generate unique image ID and R2 key
    const imageId = nanoid();
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const r2Key = `images/${year}/${month}/${imageId}.png`;

    // Upload to R2
    await env.R2.put(r2Key, buffer, {
      httpMetadata: { contentType: "image/png" },
      customMetadata: {
        jobId: jobId,
        userId: job.userId || "anonymous",
        prompt: job.prompt.substring(0, 1000), // Truncate if too long
        parentImageId: parentImageId, // Store parent relationship in metadata
      },
    });

    // Calculate SHA256 hash
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new Uint8Array(buffer),
    );
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store image record with parent reference
    const imageRecord: schema.NewImage = {
      id: imageId,
      userId: job.userId!,
      prompt: job.prompt,
      negativePrompt: job.negativePrompt,
      model: modelName,
      guidance: job.guidance,
      steps: job.steps,
      seed: job.seed,
      aspectRatio: job.aspectRatio,
      width: job.width,
      height: job.height,
      bytes: buffer.byteLength,
      sha256: hash,
      r2Bucket: "ppoi-images",
      r2Key: r2Key,
      isPrivate: job.isPrivate,
      parentId: parentImageId, // Set the parent relationship
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(schema.images).values(imageRecord);

    // Process user-provided tags and generate AI tags
    let allTags: string[] = [];
    if (job.tags) {
      const userTags = JSON.parse(job.tags) as string[];
      allTags = [...userTags];
    }

    // Generate AI tags for remixed content
    try {
      const aiTags = await generateAiTags(env, job.prompt, job.negativePrompt);
      const uniqueAiTags = aiTags.filter(
        (tag: string) =>
          !allTags.some(
            (userTag: string) => userTag.toLowerCase() === tag.toLowerCase(),
          ),
      );
      allTags = [...allTags, ...uniqueAiTags].slice(0, 15); // Limit to 15 tags total
    } catch (error) {
      console.warn("Failed to generate AI tags for remix:", error);
    }

    // Process all tags
    if (allTags.length > 0) {
      await processTags(db, imageId, allTags);
    }

    // Update user image count
    if (job.userId) {
      await db
        .update(schema.users)
        .set({
          imageCount: sql`${schema.users.imageCount} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.users.id, job.userId));
    }

    // Complete the job
    await db
      .update(schema.generationJobs)
      .set({
        status: "completed",
        resultImageId: imageId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.generationJobs.id, jobId));
  } catch (error) {
    console.error(`Remix job ${jobId} failed:`, error);

    // Mark job as failed
    await db
      .update(schema.generationJobs)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.generationJobs.id, jobId));
  }
}

// Helper functions for remix functionality
async function generateAiTags(
  env: Env,
  prompt: string,
  negativePrompt?: string | null,
): Promise<string[]> {
  try {
    const tagPrompt = `Analyze this anime/art generation prompt and extract relevant tags for categorization and search.

Prompt: "${prompt}"
${negativePrompt ? `Negative Prompt: "${negativePrompt}"` : ""}

Please respond with ONLY a comma-separated list of relevant tags (max 10 tags).

Tags:`;

    const response = (await env.AI.run("@cf/meta/llama-2-7b-chat-fp16", {
      messages: [{ role: "user", content: tagPrompt }],
      max_tokens: 100,
      temperature: 0.1,
    })) as { response?: string };

    if (!response.response) return [];

    const responseText = response.response
      .toLowerCase()
      .trim()
      .replace(/^(tags?:\s*|here are the tags:\s*)/i, "");

    const rawTags = responseText
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 10);

    const validTags: string[] = [];
    for (const tag of rawTags) {
      const cleanTag = tag.replace(/['"]/g, "").trim();
      if (
        cleanTag.length >= 2 &&
        cleanTag.length <= 30 &&
        /^[a-z0-9\s\-]+$/i.test(cleanTag)
      ) {
        if (
          !validTags.some(
            (existing) => existing.toLowerCase() === cleanTag.toLowerCase(),
          )
        ) {
          validTags.push(cleanTag);
        }
      }
    }

    return validTags;
  } catch (error) {
    console.error("AI tag generation failed:", error);
    return ["anime"]; // Minimal fallback
  }
}

async function processTags(
  db: ReturnType<typeof drizzle<typeof schema>>,
  imageId: string,
  tagNames: string[],
): Promise<void> {
  for (const tagName of tagNames) {
    const normalizedTag = tagName.toLowerCase().trim();
    if (!normalizedTag) continue;

    // Insert tag if it doesn't exist
    try {
      await db.insert(schema.tags).values({
        name: normalizedTag,
        usage_count: 1,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Tag exists, increment usage count
      await db
        .update(schema.tags)
        .set({
          usage_count: sql`${schema.tags.usage_count} + 1`,
        })
        .where(eq(schema.tags.name, normalizedTag));
    }

    // Get tag ID and create relationship
    const tags = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.name, normalizedTag))
      .limit(1);

    if (tags[0]) {
      try {
        await db.insert(schema.imageTags).values({
          imageId: imageId,
          tagId: tags[0].id,
        });
      } catch {
        // Relationship already exists, ignore
      }
    }
  }
}

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const buffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(buffer);
}
