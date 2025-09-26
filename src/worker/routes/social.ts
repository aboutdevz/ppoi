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

// Like/Unlike an image (toggle endpoint)
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
      .where(
        and(eq(schema.likes.userId, userId), eq(schema.likes.imageId, imageId)),
      )
      .limit(1);

    let isLiked: boolean;

    if (existingLike.length > 0) {
      // Unlike - remove existing like
      await db
        .delete(schema.likes)
        .where(
          and(
            eq(schema.likes.userId, userId),
            eq(schema.likes.imageId, imageId),
          ),
        );

      // Decrease counts
      await db
        .update(schema.images)
        .set({
          likeCount: sql`${schema.images.likeCount} - 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.images.id, imageId));

      await db
        .update(schema.users)
        .set({
          likeCount: sql`${schema.users.likeCount} - 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.users.id, userId));

      isLiked = false;
    } else {
      // Like - add new like
      await db.insert(schema.likes).values({
        userId,
        imageId,
        createdAt: new Date().toISOString(),
      });

      // Increase counts
      await db
        .update(schema.images)
        .set({
          likeCount: sql`${schema.images.likeCount} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.images.id, imageId));

      await db
        .update(schema.users)
        .set({
          likeCount: sql`${schema.users.likeCount} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.users.id, userId));

      isLiked = true;
    }

    // Get updated like count
    const images = await db
      .select({ likeCount: schema.images.likeCount })
      .from(schema.images)
      .where(eq(schema.images.id, imageId))
      .limit(1);

    const likeCount = images[0]?.likeCount || 0;

    return c.json({
      success: true,
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error("Like toggle error:", error);
    return c.json({ error: "Failed to toggle like" }, 500);
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

    const formattedComments = comments.map((comment) => ({
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

// Toggle follow/unfollow (convenience endpoint)
socialRoute.post(
  "/follow/toggle",
  zValidator("json", followSchema),
  async (c) => {
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
        .where(
          and(
            eq(schema.follows.followerId, userId),
            eq(schema.follows.followingId, targetUserId),
          ),
        )
        .limit(1);

      let isFollowing: boolean;

      if (existingFollow.length > 0) {
        // Unfollow
        await db
          .delete(schema.follows)
          .where(
            and(
              eq(schema.follows.followerId, userId),
              eq(schema.follows.followingId, targetUserId),
            ),
          );

        // Update counts
        await db
          .update(schema.users)
          .set({
            followerCount: sql`${schema.users.followerCount} - 1`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.users.id, targetUserId));

        await db
          .update(schema.users)
          .set({
            followingCount: sql`${schema.users.followingCount} - 1`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.users.id, userId));

        isFollowing = false;
      } else {
        // Follow
        await db.insert(schema.follows).values({
          followerId: userId,
          followingId: targetUserId,
          createdAt: new Date().toISOString(),
        });

        // Update counts
        await db
          .update(schema.users)
          .set({
            followerCount: sql`${schema.users.followerCount} + 1`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.users.id, targetUserId));

        await db
          .update(schema.users)
          .set({
            followingCount: sql`${schema.users.followingCount} + 1`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.users.id, userId));

        isFollowing = true;
      }

      // Get updated follower count
      const users = await db
        .select({ followerCount: schema.users.followerCount })
        .from(schema.users)
        .where(eq(schema.users.id, targetUserId))
        .limit(1);

      const followerCount = users[0]?.followerCount || 0;

      return c.json({
        success: true,
        isFollowing,
        followerCount,
      });
    } catch (error) {
      console.error("Follow toggle error:", error);
      return c.json({ error: "Failed to toggle follow" }, 500);
    }
  },
);

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
      .where(
        and(
          eq(schema.follows.followerId, userId),
          eq(schema.follows.followingId, targetUserId),
        ),
      )
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

    return c.json({ success: true, isFollowing: true });
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
      .where(
        and(
          eq(schema.follows.followerId, userId),
          eq(schema.follows.followingId, targetUserId),
        ),
      );

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

// Get user's liked images
socialRoute.get("/likes", async (c) => {
  try {
    const userId = c.req.header("X-PPOI-User");

    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const db = drizzle(c.env.DB, { schema });

    // Get liked images with image details
    const likedImages = await db
      .select({
        id: schema.images.id,
        prompt: schema.images.prompt,
        r2Key: schema.images.r2Key,
        aspectRatio: schema.images.aspectRatio,
        width: schema.images.width,
        height: schema.images.height,
        model: schema.images.model,
        isPrivate: schema.images.isPrivate,
        likeCount: schema.images.likeCount,
        commentCount: schema.images.commentCount,
        createdAt: schema.images.createdAt,
        likedAt: schema.likes.createdAt,
        userId: schema.images.userId,
        userName: schema.users.name,
        userHandle: schema.users.handle,
        userImage: schema.users.image,
        isAnonymous: schema.users.isAnonymous,
      })
      .from(schema.likes)
      .leftJoin(schema.images, eq(schema.likes.imageId, schema.images.id))
      .leftJoin(schema.users, eq(schema.images.userId, schema.users.id))
      .where(
        and(
          eq(schema.likes.userId, userId),
          eq(schema.images.isPrivate, false), // Only show public images
        ),
      )
      .orderBy(desc(schema.likes.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedImages = likedImages.map((item) => {
      // Convert r2Key to full URL
      const url = new URL(c.req.url);
      const imageUrl = item.r2Key
        ? `${url.protocol}//${url.host}/v1/serve/${item.r2Key}`
        : "";

      return {
        id: item.id,
        prompt: item.prompt,
        url: imageUrl,
        aspectRatio: item.aspectRatio,
        width: item.width,
        height: item.height,
        model: item.model,
        isPrivate: item.isPrivate,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
        createdAt: item.createdAt,
        likedAt: item.likedAt,
        user: {
          id: item.userId,
          name: item.userName,
          handle: item.userHandle,
          image: item.userImage,
          isAnonymous: item.isAnonymous,
        },
      };
    });

    return c.json({
      images: formattedImages,
      pagination: {
        page,
        limit,
        hasNext: likedImages.length === limit,
      },
    });
  } catch (error) {
    console.error("Get liked images error:", error);
    return c.json({ error: "Failed to fetch liked images" }, 500);
  }
});

// Get user's followers
socialRoute.get("/follow/:userId/followers", async (c) => {
  try {
    const targetUserId = c.req.param("userId");
    const currentUserId = c.req.header("X-PPOI-User");
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const db = drizzle(c.env.DB, { schema });

    // Get followers with user details
    const followers = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        handle: schema.users.handle,
        image: schema.users.image,
        bio: schema.users.bio,
        isAnonymous: schema.users.isAnonymous,
        imageCount: schema.users.imageCount,
        followerCount: schema.users.followerCount,
        followingCount: schema.users.followingCount,
        followedAt: schema.follows.createdAt,
      })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followerId, schema.users.id))
      .where(eq(schema.follows.followingId, targetUserId))
      .orderBy(desc(schema.follows.createdAt))
      .limit(limit)
      .offset(offset);

    // Check if current user follows each of these users
    const followersWithStatus = await Promise.all(
      followers.map(async (follower) => {
        let isFollowing = false;
        if (currentUserId && currentUserId !== follower.id) {
          const followCheck = await db
            .select()
            .from(schema.follows)
            .where(
              and(
                eq(schema.follows.followerId, currentUserId),
                eq(schema.follows.followingId, follower.id),
              ),
            )
            .limit(1);
          isFollowing = followCheck.length > 0;
        }

        return {
          id: follower.id,
          name: follower.name,
          handle: follower.handle,
          image: follower.image,
          bio: follower.bio,
          isAnonymous: follower.isAnonymous,
          isFollowing,
          stats: {
            imageCount: follower.imageCount,
            followerCount: follower.followerCount,
            followingCount: follower.followingCount,
          },
          followedAt: follower.followedAt,
        };
      }),
    );

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.follows)
      .where(eq(schema.follows.followingId, targetUserId));

    return c.json({
      users: followersWithStatus,
      pagination: {
        page,
        limit,
        total: count,
        hasMore: page * limit < count,
      },
    });
  } catch (error) {
    console.error("Get followers error:", error);
    return c.json({ error: "Failed to fetch followers" }, 500);
  }
});

// Get user's following
socialRoute.get("/follow/:userId/following", async (c) => {
  try {
    const targetUserId = c.req.param("userId");
    const currentUserId = c.req.header("X-PPOI-User");
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const db = drizzle(c.env.DB, { schema });

    // Get following with user details
    const following = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        handle: schema.users.handle,
        image: schema.users.image,
        bio: schema.users.bio,
        isAnonymous: schema.users.isAnonymous,
        imageCount: schema.users.imageCount,
        followerCount: schema.users.followerCount,
        followingCount: schema.users.followingCount,
        followedAt: schema.follows.createdAt,
      })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followingId, schema.users.id))
      .where(eq(schema.follows.followerId, targetUserId))
      .orderBy(desc(schema.follows.createdAt))
      .limit(limit)
      .offset(offset);

    // Check if current user follows each of these users
    const followingWithStatus = await Promise.all(
      following.map(async (followedUser) => {
        let isFollowing = false;
        if (currentUserId && currentUserId !== followedUser.id) {
          const followCheck = await db
            .select()
            .from(schema.follows)
            .where(
              and(
                eq(schema.follows.followerId, currentUserId),
                eq(schema.follows.followingId, followedUser.id),
              ),
            )
            .limit(1);
          isFollowing = followCheck.length > 0;
        }

        return {
          id: followedUser.id,
          name: followedUser.name,
          handle: followedUser.handle,
          image: followedUser.image,
          bio: followedUser.bio,
          isAnonymous: followedUser.isAnonymous,
          isFollowing,
          stats: {
            imageCount: followedUser.imageCount,
            followerCount: followedUser.followerCount,
            followingCount: followedUser.followingCount,
          },
          followedAt: followedUser.followedAt,
        };
      }),
    );

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.follows)
      .where(eq(schema.follows.followerId, targetUserId));

    return c.json({
      users: followingWithStatus,
      pagination: {
        page,
        limit,
        total: count,
        hasMore: page * limit < count,
      },
    });
  } catch (error) {
    console.error("Get following error:", error);
    return c.json({ error: "Failed to fetch following" }, 500);
  }
});
