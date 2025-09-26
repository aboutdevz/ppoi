import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and, sql } from "drizzle-orm";
import * as schema from "../../db/schema";

export const exploreRoute = new Hono<{ Bindings: Env }>();

// Cache configuration
const CACHE_TTL = {
  EXPLORE: 300, // 5 minutes
  TRENDING_TAGS: 900, // 15 minutes
} as const;

const exploreQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["recent", "popular", "trending"]).default("recent"),
  tags: z.string().optional(), // Comma-separated tags
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional(),
});

// Explore endpoint - public gallery
exploreRoute.get(
  "/explore",
  zValidator("query", exploreQuerySchema),
  async (c) => {
    try {
      const { page, limit, sortBy, tags, aspectRatio } = c.req.valid("query");

      // Generate cache key based on query parameters
      const cacheKey = `explore:${sortBy}:${aspectRatio || "all"}:${tags || "none"}:${page}:${limit}`;

      // Try to get cached response (only for first page and no user-specific data)
      if (page === 1) {
        const cached = await c.env.KV.get(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          // Add cache headers
          c.header("X-Cache", "HIT");
          c.header("Cache-Control", "public, max-age=300");
          return c.json(cachedData);
        }
      }

      const db = drizzle(c.env.DB, { schema });
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(schema.images.isPrivate, false)];

      if (aspectRatio) {
        conditions.push(eq(schema.images.aspectRatio, aspectRatio));
      }

      // Handle tag filtering
      if (tags) {
        // Parse comma-separated tags
        const tagList = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        if (tagList.length > 0) {
          // Join with imageTags and tags to filter by any of the tags
          const taggedImages = await db
            .select({ imageId: schema.imageTags.imageId })
            .from(schema.imageTags)
            .leftJoin(schema.tags, eq(schema.imageTags.tagId, schema.tags.id))
            .where(
              sql`${schema.tags.name} IN (${sql.join(
                tagList.map((tag) => sql`${tag}`),
                sql`,`,
              )})`,
            );

          const imageIds = taggedImages.map((t) => t.imageId);
          if (imageIds.length > 0) {
            conditions.push(
              sql`${schema.images.id} IN (${sql.join(
                imageIds.map((id) => sql`${id}`),
                sql`,`,
              )})`,
            );
          } else {
            // No images found with these tags, return empty result
            return c.json({
              data: [],
              pagination: {
                hasMore: false,
                total: 0,
              },
            });
          }
        }
      }

      // Determine sort order
      let orderBy;
      switch (sortBy) {
        case "popular":
          orderBy = desc(schema.images.likeCount);
          break;
        case "trending":
          // Trending: combine likes and recent activity
          orderBy = desc(
            sql`(${schema.images.likeCount} + ${schema.images.commentCount} * 2) / (JULIANDAY('now') - JULIANDAY(${schema.images.createdAt}) + 1)`,
          );
          break;
        case "recent":
        default:
          orderBy = desc(schema.images.createdAt);
          break;
      }

      // Build the base query with tags
      const imagesQuery = db
        .select({
          id: schema.images.id,
          userId: schema.images.userId,
          prompt: schema.images.prompt,
          model: schema.images.model,
          aspectRatio: schema.images.aspectRatio,
          width: schema.images.width,
          height: schema.images.height,
          r2Key: schema.images.r2Key,
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
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const images = await imagesQuery;

      // Get tags for each image
      const imageIds = images.map((img) => img.id);
      const imageTags =
        imageIds.length > 0
          ? await db
              .select({
                imageId: schema.imageTags.imageId,
                tagName: schema.tags.name,
              })
              .from(schema.imageTags)
              .leftJoin(schema.tags, eq(schema.imageTags.tagId, schema.tags.id))
              .where(
                sql`${schema.imageTags.imageId} IN (${sql.join(
                  imageIds.map((id) => sql`${id}`),
                  sql`,`,
                )})`,
              )
          : [];

      // Group tags by image
      const tagsMap = new Map<string, string[]>();
      for (const imageTag of imageTags) {
        if (!tagsMap.has(imageTag.imageId)) {
          tagsMap.set(imageTag.imageId, []);
        }
        if (imageTag.tagName) {
          tagsMap.get(imageTag.imageId)!.push(imageTag.tagName);
        }
      }

      // Get total count for pagination
      const [{ count: totalCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.images)
        .where(and(...conditions));

      // Helper function to get image URL
      const getImageUrl = (r2Key: string): string => {
        const url = new URL(c.req.url);
        return `${url.protocol}//${url.host}/v1/serve/${r2Key}`;
      };

      // Format response
      const formattedImages = images.map((image) => ({
        id: image.id,
        url: getImageUrl(image.r2Key),
        prompt: image.prompt,
        model: image.model || "unknown",
        aspectRatio: image.aspectRatio,
        width: image.width || 1024,
        height: image.height || 1024,
        likeCount: image.likeCount,
        commentCount: image.commentCount,
        createdAt: image.createdAt,
        user: {
          id: image.userId || "",
          name: image.userName || "Anonymous",
          handle: image.userHandle || "anonymous",
          image: image.userImage,
          isAnonymous: image.isAnonymous ?? true,
        },
        tags: tagsMap.get(image.id) || [],
      }));

      const responseData = {
        data: formattedImages,
        pagination: {
          hasMore: page * limit < totalCount,
          total: totalCount,
        },
      };

      // Cache the response for first page only
      if (page === 1) {
        await c.env.KV.put(cacheKey, JSON.stringify(responseData), {
          expirationTtl: CACHE_TTL.EXPLORE,
        });
      }

      // Add cache headers
      c.header("X-Cache", "MISS");
      c.header("Cache-Control", "public, max-age=300");

      return c.json(responseData);
    } catch (error) {
      console.error("Explore error:", error);
      return c.json({ error: "Failed to fetch images" }, 500);
    }
  },
);

// Get trending tags
exploreRoute.get("/explore/trending-tags", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "20");
    const cacheKey = `trending_tags:${limit}`;

    // Try to get cached response
    const cached = await c.env.KV.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      c.header("X-Cache", "HIT");
      c.header("Cache-Control", "public, max-age=900");
      return c.json(cachedData);
    }

    const db = drizzle(c.env.DB, { schema });

    const tags = await db
      .select({
        name: schema.tags.name,
        count: schema.tags.usage_count,
      })
      .from(schema.tags)
      .orderBy(desc(schema.tags.usage_count))
      .limit(Math.min(limit, 50)); // Max 50 tags

    const responseData = { tags };

    // Cache the response
    await c.env.KV.put(cacheKey, JSON.stringify(responseData), {
      expirationTtl: CACHE_TTL.TRENDING_TAGS,
    });

    c.header("X-Cache", "MISS");
    c.header("Cache-Control", "public, max-age=900");

    return c.json(responseData);
  } catch (error) {
    console.error("Trending tags error:", error);
    return c.json({ error: "Failed to fetch trending tags" }, 500);
  }
});
