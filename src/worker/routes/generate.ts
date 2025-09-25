import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { nanoid } from "nanoid";
import type { AiModels } from "@cloudflare/workers-types";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";

// Rate limiting configuration
const RATE_LIMITS = {
  FAST: { requests: 20, windowMs: 15 * 60 * 1000 }, // 20 requests per 15 minutes
  QUALITY: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  ANONYMOUS: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 requests per hour
} as const;

const generateRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  negativePrompt: z.string().max(500).optional(),
  quality: z.enum(["fast", "quality"]).default("fast"),
  guidance: z.number().min(1).max(30).default(7.5),
  steps: z.number().min(1).max(50).default(20),
  seed: z.number().int().min(0).max(2147483647).optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
  tags: z.array(z.string()).max(10).optional(),
  isPrivate: z.boolean().default(false),
});

export const generateRoute = new Hono<{ Bindings: Env }>();

// Rate limiting helper
async function checkRateLimit(
  env: Env,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const rateLimitKey = `rate_limit:${key}:${window}`;

  const current = await env.KV.get(rateLimitKey);
  const count = current ? parseInt(current) : 0;

  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: (window + 1) * windowMs,
    };
  }

  await env.KV.put(rateLimitKey, (count + 1).toString(), {
    expirationTtl: Math.ceil(windowMs / 1000),
  });

  return {
    allowed: true,
    remaining: limit - count - 1,
    resetTime: (window + 1) * windowMs,
  };
}

// Image generation endpoint
generateRoute.post(
  "/generate",
  zValidator("json", generateRequestSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const db = drizzle(c.env.DB, { schema });
      const clientIp = c.req.header("CF-Connecting-IP") || "unknown";
      const userAgent = c.req.header("User-Agent") || "unknown";

      // Get user from header (set by auth middleware)
      const userIdHeader = c.req.header("X-PPOI-User");
      let userId = userIdHeader || null;
      let user: schema.User | null = null;

      // If no user, create anonymous user
      if (!userId) {
        const anonymousId = nanoid();
        const anonymousName = `Anon${Math.floor(Math.random() * 10000)}`;
        const anonymousHandle = `anon_${anonymousId.slice(0, 8)}`;

        user = {
          id: anonymousId,
          name: anonymousName,
          handle: anonymousHandle,
          email: null,
          image: null,
          bio: null,
          isAnonymous: true,
          imageCount: 0,
          likeCount: 0,
          followerCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.insert(schema.users).values(user);
        userId = anonymousId;
      } else {
        // Fetch existing user
        const existingUsers = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .limit(1);
        user = existingUsers[0] || null;
      }

      if (!user) {
        return c.json({ error: "User not found" }, 400);
      }

      // Rate limiting
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(clientIp),
      );
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const rateLimitKey = user.isAnonymous
        ? `anon:${hashHex.slice(0, 16)}`
        : `user:${userId}`;

      const rateLimit = user.isAnonymous
        ? RATE_LIMITS.ANONYMOUS
        : data.quality === "quality"
          ? RATE_LIMITS.QUALITY
          : RATE_LIMITS.FAST;

      const rateLimitResult = await checkRateLimit(
        c.env,
        rateLimitKey,
        rateLimit.requests,
        rateLimit.windowMs,
      );

      if (!rateLimitResult.allowed) {
        return c.json(
          {
            error: "Rate limit exceeded",
            resetTime: rateLimitResult.resetTime,
          },
          429,
        );
      }

      // Set rate limit headers
      c.header("X-RateLimit-Limit", rateLimit.requests.toString());
      c.header("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      c.header("X-RateLimit-Reset", rateLimitResult.resetTime.toString());

      // Create generation job
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

      // Start async image generation
      c.executionCtx.waitUntil(processGenerationJob(c.env, jobId));

      return c.json({
        jobId,
        status: "pending",
        message:
          "Generation started. Check status with /generate/status/:jobId",
      });
    } catch (error) {
      console.error("Generation error:", error);
      return c.json({ error: "Failed to start generation" }, 500);
    }
  },
);

// Job status endpoint
generateRoute.get("/generate/status/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const db = drizzle(c.env.DB, { schema });

    const jobs = await db
      .select()
      .from(schema.generationJobs)
      .where(eq(schema.generationJobs.id, jobId))
      .limit(1);

    const job = jobs[0];
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    const result: {
      jobId: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      error?: string;
      image?: {
        id: string;
        url: string;
        prompt: string;
        aspectRatio: string;
        width: number;
        height: number;
      };
    } = {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    if (job.status === "failed" && job.error) {
      result.error = job.error;
    }

    if (job.status === "completed" && job.resultImageId) {
      const images = await db
        .select()
        .from(schema.images)
        .where(eq(schema.images.id, job.resultImageId))
        .limit(1);

      if (images[0]) {
        // Helper function to get image URL
        const getImageUrl = (r2Key: string): string => {
          const url = new URL(c.req.url);
          return `${url.protocol}//${url.host}/v1/serve/${r2Key}`;
        };

        result.image = {
          id: images[0].id,
          url: getImageUrl(images[0].r2Key),
          prompt: images[0].prompt,
          aspectRatio: images[0].aspectRatio,
          width: images[0].width,
          height: images[0].height,
        };
      }
    }

    return c.json(result);
  } catch (error) {
    console.error("Status check error:", error);
    return c.json({ error: "Failed to check status" }, 500);
  }
});

// Process generation job (background task)
async function processGenerationJob(env: Env, jobId: string): Promise<void> {
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
    const response = await env.AI.run(
      modelName as keyof AiModels,
      aiInput as Record<string, unknown>,
    );

    let buffer: ArrayBuffer;

    // Handle different response formats
    if (response instanceof ReadableStream) {
      // Stream response format
      buffer = await streamToArrayBuffer(response);
    } else if (
      response &&
      typeof response === "object" &&
      "image" in response
    ) {
      // Base64 response format
      const imageData = (response as { image: string }).image;
      if (typeof imageData === "string") {
        // Remove data URL prefix if present (e.g., "data:image/png;base64,")
        const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, "");
        buffer = base64ToArrayBuffer(base64Data);
      } else {
        throw new Error("Invalid image data format in AI response");
      }
    } else {
      throw new Error("Invalid AI response format");
    }

    // Generate unique filename and upload to R2
    const imageId = nanoid();
    const fileName = `${imageId}.png`;
    const r2Key = `images/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${fileName}`;

    await env.R2.put(r2Key, buffer, {
      httpMetadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000", // 1 year
      },
      customMetadata: {
        jobId: jobId,
        userId: job.userId || "anonymous",
        prompt: job.prompt,
        model: modelName,
      },
    });

    // Calculate file hash for deduplication
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Create image record
    const imageRecord: schema.NewImage = {
      id: imageId,
      userId: job.userId || "anonymous",
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
      parentId: null,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(schema.images).values(imageRecord);

    // Process user-provided tags
    let allTags: string[] = [];
    if (job.tags) {
      const userTags = JSON.parse(job.tags) as string[];
      allTags = [...userTags];
    }

    // Generate AI tags if none provided or to supplement existing tags
    try {
      const aiTags = await generateAiTags(env, job.prompt, job.negativePrompt);
      // Merge AI tags with user tags, avoiding duplicates
      const uniqueAiTags = aiTags.filter(
        (tag: string) =>
          !allTags.some(
            (userTag: string) => userTag.toLowerCase() === tag.toLowerCase(),
          ),
      );
      allTags = [...allTags, ...uniqueAiTags].slice(0, 15); // Limit to 15 tags total
    } catch (error) {
      console.warn("Failed to generate AI tags:", error);
      // Continue without AI tags
    }

    // Process all tags (user + AI generated)
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
    console.error(`Job ${jobId} failed:`, error);

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

// Process tags for an image
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
      await db.insert(schema.imageTags).values({
        imageId: imageId,
        tagId: tags[0].id,
      });
    }
  }
}

// Generate AI tags based on prompt
async function generateAiTags(
  env: Env,
  prompt: string,
  negativePrompt?: string | null,
): Promise<string[]> {
  try {
    // Create a structured prompt for tag generation
    const tagPrompt = `Analyze this anime/art generation prompt and extract relevant tags for categorization and search.

Prompt: "${prompt}"
${negativePrompt ? `Negative Prompt: "${negativePrompt}"` : ""}

Please respond with ONLY a comma-separated list of relevant tags (max 10 tags). Focus on:
- Art style (anime, manga, chibi, realistic, etc.)
- Character features (hair color, eye color, clothing, accessories)
- Setting/background elements
- Mood/atmosphere
- Genre/themes

Example response: anime, girl, purple hair, golden eyes, school uniform, portrait, kawaii, digital art

Tags:`;

    // Use Cloudflare AI for text generation to extract tags
    const response = (await env.AI.run("@cf/meta/llama-2-7b-chat-fp16", {
      messages: [
        {
          role: "user",
          content: tagPrompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.1, // Low temperature for consistent tagging
    })) as { response?: string };

    if (!response.response) {
      return [];
    }

    // Parse the response to extract tags
    const responseText = response.response.toLowerCase().trim();

    // Extract tags from the response (handle various formats)
    let tagText = responseText;

    // Remove common prefixes that the AI might add
    tagText = tagText.replace(/^(tags?:\s*|here are the tags:\s*)/i, "");

    // Split by commas and clean up
    const rawTags = tagText
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 10); // Limit to 10 AI-generated tags

    // Clean and validate tags
    const validTags: string[] = [];
    for (const tag of rawTags) {
      // Remove quotes, extra spaces, and validate
      const cleanTag = tag.replace(/['"]/g, "").trim();

      // Basic validation: 2-30 characters, alphanumeric + spaces + hyphens
      if (
        cleanTag.length >= 2 &&
        cleanTag.length <= 30 &&
        /^[a-z0-9\s\-]+$/i.test(cleanTag)
      ) {
        // Avoid duplicates (case insensitive)
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

    // Fallback: Extract basic tags from prompt using simple keyword matching
    return extractBasicTags(prompt);
  }
}

// Fallback tag extraction using keyword matching
function extractBasicTags(prompt: string): string[] {
  const tags: string[] = [];
  const lowercasePrompt = prompt.toLowerCase();

  // Define keyword categories
  const keywords = {
    // Character types
    girl: ["girl", "woman", "female"],
    boy: ["boy", "man", "male"],
    "cat girl": ["cat girl", "nekomimi", "catgirl"],

    // Hair colors
    "purple hair": ["purple hair"],
    "pink hair": ["pink hair"],
    "blue hair": ["blue hair"],
    "green hair": ["green hair"],
    "red hair": ["red hair"],
    "black hair": ["black hair"],
    "white hair": ["white hair", "silver hair"],
    "blonde hair": ["blonde", "yellow hair"],

    // Eye colors
    "golden eyes": ["golden eyes", "yellow eyes"],
    "blue eyes": ["blue eyes"],
    "green eyes": ["green eyes"],
    "red eyes": ["red eyes"],
    "purple eyes": ["purple eyes"],

    // Clothing
    "school uniform": ["school uniform", "uniform"],
    dress: ["dress"],
    armor: ["armor"],

    // Styles
    anime: ["anime"],
    manga: ["manga"],
    kawaii: ["kawaii", "cute"],
    chibi: ["chibi"],

    // Themes
    "magical girl": ["magical girl"],
    warrior: ["warrior"],
    princess: ["princess"],
    cyberpunk: ["cyberpunk"],
  };

  // Check for keyword matches
  for (const [tag, variants] of Object.entries(keywords)) {
    for (const variant of variants) {
      if (lowercasePrompt.includes(variant)) {
        tags.push(tag);
        break;
      }
    }
  }

  // Always add "anime" if not present (since this is an anime generator)
  if (!tags.includes("anime")) {
    tags.unshift("anime");
  }

  return tags.slice(0, 8); // Limit fallback tags
}

// Helper function to convert ReadableStream to ArrayBuffer
async function streamToArrayBuffer(
  stream: ReadableStream,
): Promise<ArrayBuffer> {
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

  return buffer.buffer;
}

// Helper function to convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
