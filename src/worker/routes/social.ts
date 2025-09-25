import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and, sql } from "drizzle-orm";
import * as schema from "../../db/schema";
import { nanoid } from "nanoid";

export const socialRoute = new Hono<{ Bindings: Env }>();

const likeImageSchema = z.object({
  imageId: z.string(),
});

const commentSchema = z.object({
  imageId: z.string(),
  content: z.string().min(1).max(500),
});

const followSchema = z.object({
  userId: z.string(),
});

// Like an image
socialRoute.post("/like", zValidator("json", likeImageSchema), async (c) => {
  try {
    const { imageId } = c.req.valid("json");
    const userId = c.req.header("X-PPOI-User");
    
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    
    const db = drizzle(c.env.DB, { schema });
    
    // Check if already liked
    const existingLike = await db
      .select()
      .from(schema.likes)
      .where(and(
        eq(schema.likes.userId, userId),
        eq(schema.likes.imageId, imageId)
      ))
      .limit(1);
    
    if (existingLike.length > 0) {
      return c.json({ error: "Already liked" }, 400);
    }
    
    // Add like
    await db.insert(schema.likes).values({
      userId,
      imageId,
      createdAt: new Date().toISOString(),
    });
    
    // Update image like count
    await db
      .update(schema.images)
      .set({
        likeCount: sql`${schema.images.likeCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.images.id, imageId));
    
    // Update user like count
    await db
      .update(schema.users)
      .set({
        likeCount: sql`${schema.users.likeCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, userId));
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Like error:", error);
    return c.json({ error: "Failed to like image" }, 500);
  }
});

// Unlike an image
socialRoute.delete("/like", zValidator("json", likeImageSchema), async (c) => {
  try {
    const { imageId } = c.req.valid("json");
    const userId = c.req.header("X-PPOI-User");
    
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    
    const db = drizzle(c.env.DB, { schema });
    
    // Remove like
    const result = await db
      .delete(schema.likes)
      .where(and(
        eq(schema.likes.userId, userId),
        eq(schema.likes.imageId, imageId)
      ));
    
    if (result.rowsAffected === 0) {
      return c.json({ error: "Like not found" }, 404);
    }
    
    // Update image like count
    await db
      .update(schema.images)
      .set({
        likeCount: sql`${schema.images.likeCount} - 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.images.id, imageId));
    
    // Update user like count
    await db
      .update(schema.users)
      .set({
        likeCount: sql`${schema.users.likeCount} - 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, userId));
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Unlike error:", error);
    return c.json({ error: "Failed to unlike image" }, 500);
  }
});

// Add comment to image
socialRoute.post("/comment", zValidator("json", commentSchema), async (c) => {
  try {
    const { imageId, content } = c.req.valid("json");
    const userId = c.req.header("X-PPOI-User");
    
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    
    const db = drizzle(c.env.DB, { schema });
    
    // Sanitize content (basic HTML stripping)
    const sanitizedContent = content.replace(/<[^>]*>/g, "").trim();
    
    if (!sanitizedContent) {
      return c.json({ error: "Comment cannot be empty" }, 400);
    }
    
    const commentId = nanoid();
    
    // Add comment
    await db.insert(schema.comments).values({
      id: commentId,
      imageId,
      userId,
      content: sanitizedContent,
      createdAt: new Date().toISOString(),
    });
    
    // Update image comment count
    await db
      .update(schema.images)
      .set({
        commentCount: sql`${schema.images.commentCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.images.id, imageId));
    
    // Get user info for response
    const users = await db
      .select({
        name: schema.users.name,
        handle: schema.users.handle,
        image: schema.users.image,
        isAnonymous: schema.users.isAnonymous,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    
    const user = users[0];
    
    return c.json({
      comment: {
        id: commentId,
        content: sanitizedContent,
        createdAt: new Date().toISOString(),
        user: {
          id: userId,
          name: user?.name,
          handle: user?.handle,
          image: user?.image,
          isAnonymous: user?.isAnonymous,
        },
      },
    });
    
  } catch (error) {
    console.error("Comment error:", error);
    return c.json({ error: "Failed to add comment" }, 500);
  }
});

// Get comments for an image
socialRoute.get("/comments/:imageId", async (c) => {
  try {
    const imageId = c.req.param("imageId");
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    
    const db = drizzle(c.env.DB, { schema });
    
    const comments = await db
      .select({
        id: schema.comments.id,
        content: schema.comments.content,
        createdAt: schema.comments.createdAt,
        userId: schema.users.id,
        userName: schema.users.name,
        userHandle: schema.users.handle,
        userImage: schema.users.image,
        isAnonymous: schema.users.isAnonymous,
      })
      .from(schema.comments)
      .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(eq(schema.comments.imageId, imageId))
      .orderBy(desc(schema.comments.createdAt))
      .limit(limit)
      .offset(offset);
    
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.userId,
        name: comment.userName,
        handle: comment.userHandle,
        image: comment.userImage,
        isAnonymous: comment.isAnonymous,
      },
    }));
    
    return c.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        hasNext: comments.length === limit,
      },
    });
    
  } catch (error) {
    console.error("Get comments error:", error);
    return c.json({ error: "Failed to fetch comments" }, 500);
  }
});

// Follow user
socialRoute.post("/follow", zValidator("json", followSchema), async (c) => {
  try {
    const { userId: targetUserId } = c.req.valid("json");
    const userId = c.req.header("X-PPOI-User");
    
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    
    if (userId === targetUserId) {
      return c.json({ error: "Cannot follow yourself" }, 400);
    }
    
    const db = drizzle(c.env.DB, { schema });
    
    // Check if already following
    const existingFollow = await db
      .select()
      .from(schema.follows)
      .where(and(
        eq(schema.follows.followerId, userId),
        eq(schema.follows.followingId, targetUserId)
      ))
      .limit(1);
    
    if (existingFollow.length > 0) {
      return c.json({ error: "Already following" }, 400);
    }
    
    // Add follow
    await db.insert(schema.follows).values({
      followerId: userId,
      followingId: targetUserId,
      createdAt: new Date().toISOString(),
    });
    
    // Update follower count for target user
    await db
      .update(schema.users)
      .set({
        followerCount: sql`${schema.users.followerCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, targetUserId));
    
    // Update following count for current user
    await db
      .update(schema.users)
      .set({
        followingCount: sql`${schema.users.followingCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, userId));
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Follow error:", error);
    return c.json({ error: "Failed to follow user" }, 500);
  }
});

// Unfollow user
socialRoute.delete("/follow", zValidator("json", followSchema), async (c) => {
  try {
    const { userId: targetUserId } = c.req.valid("json");
    const userId = c.req.header("X-PPOI-User");
    
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    
    const db = drizzle(c.env.DB, { schema });
    
    // Remove follow
    const result = await db
      .delete(schema.follows)
      .where(and(
        eq(schema.follows.followerId, userId),
        eq(schema.follows.followingId, targetUserId)
      ));
    
    if (result.rowsAffected === 0) {
      return c.json({ error: "Not following" }, 404);
    }
    
    // Update follower count for target user
    await db
      .update(schema.users)
      .set({
        followerCount: sql`${schema.users.followerCount} - 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, targetUserId));
    
    // Update following count for current user
    await db
      .update(schema.users)
      .set({
        followingCount: sql`${schema.users.followingCount} - 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.users.id, userId));
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error("Unfollow error:", error);
    return c.json({ error: "Failed to unfollow user" }, 500);
  }
});
