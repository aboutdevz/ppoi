import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and, sql, or, like } from "drizzle-orm";
import * as schema from "../../db/schema";

export const searchRoute = new Hono<{ Bindings: Env }>();

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(["images", "users", "prompts"]).default("images"),
});

type SearchResult = {
  type: "image" | "user" | "prompt";
  [key: string]: unknown;
};

// Search endpoint
searchRoute.get(
  "/search",
  zValidator("query", searchQuerySchema),
  async (c) => {
    try {
      const { q: query, page, limit, type } = c.req.valid("query");
      const db = drizzle(c.env.DB, { schema });
      const offset = (page - 1) * limit;

      let results: SearchResult[] = [];
      let totalCount = 0;

      switch (type) {
        case "images": {
          // Search in prompts
          const searchTerms = query
            .toLowerCase()
            .split(" ")
            .filter((term) => term.length > 0);

          // Build search conditions for each term
          const searchConditions = searchTerms.map((term) =>
            or(
              like(sql`lower(${schema.images.prompt})`, `%${term}%`),
              like(sql`lower(${schema.images.negativePrompt})`, `%${term}%`),
            ),
          );

          const images = await db
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
            .where(
              and(eq(schema.images.isPrivate, false), or(...searchConditions)),
            )
            .orderBy(
              desc(schema.images.likeCount),
              desc(schema.images.createdAt),
            )
            .limit(limit)
            .offset(offset);

          // Get count
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.images)
            .where(
              and(eq(schema.images.isPrivate, false), or(...searchConditions)),
            );

          totalCount = count;
          // Helper function to get image URL
          const getImageUrl = (r2Key: string): string => {
            const url = new URL(c.req.url);
            return `${url.protocol}//${url.host}/v1/serve/${r2Key}`;
          };

          results = images.map((image) => ({
            type: "image",
            id: image.id,
            url: getImageUrl(image.r2Key),
            prompt: image.prompt,
            model: image.model,
            aspectRatio: image.aspectRatio,
            width: image.width,
            height: image.height,
            likeCount: image.likeCount,
            commentCount: image.commentCount,
            createdAt: image.createdAt,
            user: {
              id: image.userId,
              name: image.userName,
              handle: image.userHandle,
              image: image.userImage,
              isAnonymous: image.isAnonymous,
            },
          }));
          break;
        }

        case "users": {
          const users = await db
            .select({
              id: schema.users.id,
              name: schema.users.name,
              handle: schema.users.handle,
              image: schema.users.image,
              bio: schema.users.bio,
              isAnonymous: schema.users.isAnonymous,
              imageCount: schema.users.imageCount,
              likeCount: schema.users.likeCount,
              followerCount: schema.users.followerCount,
              createdAt: schema.users.createdAt,
            })
            .from(schema.users)
            .where(
              and(
                or(
                  like(
                    sql`lower(${schema.users.name})`,
                    `%${query.toLowerCase()}%`,
                  ),
                  like(
                    sql`lower(${schema.users.handle})`,
                    `%${query.toLowerCase()}%`,
                  ),
                  like(
                    sql`lower(${schema.users.bio})`,
                    `%${query.toLowerCase()}%`,
                  ),
                ),
                eq(schema.users.isAnonymous, false), // Only non-anonymous users
              ),
            )
            .orderBy(
              desc(schema.users.followerCount),
              desc(schema.users.imageCount),
            )
            .limit(limit)
            .offset(offset);

          // Get count
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.users)
            .where(
              and(
                or(
                  like(
                    sql`lower(${schema.users.name})`,
                    `%${query.toLowerCase()}%`,
                  ),
                  like(
                    sql`lower(${schema.users.handle})`,
                    `%${query.toLowerCase()}%`,
                  ),
                  like(
                    sql`lower(${schema.users.bio})`,
                    `%${query.toLowerCase()}%`,
                  ),
                ),
                eq(schema.users.isAnonymous, false),
              ),
            );

          totalCount = count;
          results = users.map((user) => ({
            type: "user",
            id: user.id,
            name: user.name,
            handle: user.handle,
            image: user.image,
            bio: user.bio,
            imageCount: user.imageCount,
            likeCount: user.likeCount,
            followerCount: user.followerCount,
            createdAt: user.createdAt,
          }));
          break;
        }

        case "prompts": {
          // Search for unique prompts with their most popular images
          const prompts = await db
            .select({
              prompt: schema.images.prompt,
              imageCount: sql<number>`count(*)`,
              totalLikes: sql<number>`sum(${schema.images.likeCount})`,
              sampleImageId: schema.images.id,
              sampleR2Key: schema.images.r2Key,
              sampleWidth: schema.images.width,
              sampleHeight: schema.images.height,
              sampleAspectRatio: schema.images.aspectRatio,
            })
            .from(schema.images)
            .where(
              and(
                eq(schema.images.isPrivate, false),
                like(
                  sql`lower(${schema.images.prompt})`,
                  `%${query.toLowerCase()}%`,
                ),
              ),
            )
            .groupBy(schema.images.prompt)
            .orderBy(
              desc(sql<number>`sum(${schema.images.likeCount})`),
              desc(sql<number>`count(*)`),
            )
            .limit(limit)
            .offset(offset);

          // Get count
          const [{ count }] = await db
            .select({
              count: sql<number>`count(distinct ${schema.images.prompt})`,
            })
            .from(schema.images)
            .where(
              and(
                eq(schema.images.isPrivate, false),
                like(
                  sql`lower(${schema.images.prompt})`,
                  `%${query.toLowerCase()}%`,
                ),
              ),
            );

          totalCount = count;
          // Helper function to get image URL
          const getImageUrl = (r2Key: string): string => {
            const url = new URL(c.req.url);
            return `${url.protocol}//${url.host}/v1/serve/${r2Key}`;
          };

          results = prompts.map((prompt) => ({
            type: "prompt",
            prompt: prompt.prompt,
            imageCount: prompt.imageCount,
            totalLikes: prompt.totalLikes,
            sampleImage: {
              id: prompt.sampleImageId,
              url: getImageUrl(prompt.sampleR2Key),
              width: prompt.sampleWidth,
              height: prompt.sampleHeight,
              aspectRatio: prompt.sampleAspectRatio,
            },
          }));
          break;
        }
      }

      return c.json({
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
        query,
        type,
      });
    } catch (error) {
      console.error("Search error:", error);
      return c.json({ error: "Search failed" }, 500);
    }
  },
);

// Get search suggestions
searchRoute.get("/suggestions", async (c) => {
  try {
    const query = c.req.query("q");
    if (!query || query.length < 2) {
      return c.json({ suggestions: [] });
    }

    const db = drizzle(c.env.DB, { schema });

    // Get tag suggestions
    const tags = await db
      .select({
        name: schema.tags.name,
        usage_count: schema.tags.usage_count,
      })
      .from(schema.tags)
      .where(like(schema.tags.name, `%${query.toLowerCase()}%`))
      .orderBy(desc(schema.tags.usage_count))
      .limit(10);

    const suggestions = tags.map((tag) => ({
      type: "tag",
      text: tag.name,
      count: tag.usage_count,
    }));

    return c.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    return c.json({ error: "Failed to get suggestions" }, 500);
  }
});
