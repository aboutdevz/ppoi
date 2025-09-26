import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../index";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql, and, desc } from "drizzle-orm";

import * as schema from "../../db/schema";

export const usersRoute = new Hono<{ Bindings: Env }>();

const syncUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  bio: z.string().max(500).optional(),
  image: z.string().optional(),
});

// Sync user from NextAuth (internal API)
usersRoute.post(
  "/users/sync",
  zValidator("json", syncUserSchema),
  async (c) => {
    try {
      // Verify this is an internal API call
      const internalHeader = c.req.header("X-Internal-API");
      if (internalHeader !== "true") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { id, email, name, image } = c.req.valid("json");
      const db = drizzle(c.env.DB, { schema });

      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      let user;

      if (existingUsers.length === 0) {
        // Create new user
        const baseHandle =
          name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
        let handle = baseHandle;
        let counter = 1;

        // Ensure unique handle
        while (true) {
          const handleCheck = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.handle, handle))
            .limit(1);

          if (handleCheck.length === 0) break;

          handle = `${baseHandle}${counter}`;
          counter++;
        }

        const newUser: schema.NewUser = {
          id,
          email,
          name,
          handle,
          image: image || null,
          bio: null,
          isAnonymous: false,
          imageCount: 0,
          likeCount: 0,
          followerCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.insert(schema.users).values(newUser);
        user = newUser;
      } else {
        // Update existing user if needed
        const existingUser = existingUsers[0];
        const updates: Partial<schema.User> = {};

        if (existingUser.name !== name) updates.name = name;
        if (existingUser.email !== email) updates.email = email;
        if (existingUser.image !== image) updates.image = image || null;

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date().toISOString();

          await db
            .update(schema.users)
            .set(updates)
            .where(eq(schema.users.id, id));

          user = { ...existingUser, ...updates };
        } else {
          user = existingUser;
        }
      }

      return c.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          handle: user.handle,
          email: user.email,
          image: user.image,
          bio: user.bio,
          isAnonymous: user.isAnonymous,
          stats: {
            imageCount: user.imageCount,
            likeCount: user.likeCount,
            followerCount: user.followerCount,
            followingCount: user.followingCount,
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("User sync error:", error);
      return c.json({ error: "Failed to sync user" }, 500);
    }
  },
);

// Get user profile by handle
usersRoute.get("/users/handle/:handle", async (c) => {
  try {
    const handle = c.req.param("handle");
    const currentUserId = c.req.header("X-PPOI-User");
    const db = drizzle(c.env.DB, { schema });

    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.handle, handle))
      .limit(1);

    const user = users[0];
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follows = await db
        .select()
        .from(schema.follows)
        .where(
          sql`${schema.follows.followerId} = ${currentUserId} AND ${schema.follows.followingId} = ${user.id}`,
        )
        .limit(1);
      isFollowing = follows.length > 0;
    }

    // For private profiles, limit information if not following or not own profile
    const isOwnProfile = currentUserId === user.id;
    const canViewFull = isOwnProfile || !user.isAnonymous || isFollowing;

    const publicUser = {
      id: user.id,
      name: user.name,
      handle: user.handle,
      image: user.image,
      bio: user.bio,
      isAnonymous: user.isAnonymous,
      stats: {
        imageCount: user.imageCount,
        likeCount: user.likeCount,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
      },
      createdAt: user.createdAt,
      isFollowing,
      canViewFull,
    };

    // Add private fields for own profile
    if (isOwnProfile) {
      return c.json({
        ...publicUser,
        email: user.email,
      });
    }

    return c.json(publicUser);
  } catch (error) {
    console.error("Get user by handle error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// Get user profile by ID
usersRoute.get("/users/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const currentUserId = c.req.header("X-PPOI-User");
    const db = drizzle(c.env.DB, { schema });

    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    const user = users[0];
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const follows = await db
        .select()
        .from(schema.follows)
        .where(
          sql`${schema.follows.followerId} = ${currentUserId} AND ${schema.follows.followingId} = ${userId}`,
        )
        .limit(1);
      isFollowing = follows.length > 0;
    }

    // For private profiles, limit information if not following or not own profile
    const isOwnProfile = currentUserId === userId;
    const canViewFull = isOwnProfile || !user.isAnonymous || isFollowing;

    const publicUser = {
      id: user.id,
      name: user.name,
      handle: user.handle,
      image: user.image,
      bio: user.bio,
      isAnonymous: user.isAnonymous,
      stats: {
        imageCount: user.imageCount,
        likeCount: user.likeCount,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
      },
      createdAt: user.createdAt,
      isFollowing,
      canViewFull,
    };

    // Add private fields for own profile
    if (isOwnProfile) {
      return c.json({
        ...publicUser,
        email: user.email,
      });
    }

    return c.json(publicUser);
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// Update user profile
usersRoute.put(
  "/users/:userId",
  zValidator("json", updateUserSchema),
  async (c) => {
    try {
      const userId = c.req.param("userId");
      const currentUserId = c.req.header("X-PPOI-User");

      if (!currentUserId || currentUserId !== userId) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const updates = c.req.valid("json");
      const db = drizzle(c.env.DB, { schema });

      // Verify user exists
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (users.length === 0) {
        return c.json({ error: "User not found" }, 404);
      }

      // Apply updates
      const updateData: Partial<schema.User> = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId));

      // Return updated user
      const updatedUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      const updatedUser = updatedUsers[0];

      return c.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          handle: updatedUser.handle,
          email: updatedUser.email,
          image: updatedUser.image,
          bio: updatedUser.bio,
          isAnonymous: updatedUser.isAnonymous,
          stats: {
            imageCount: updatedUser.imageCount,
            likeCount: updatedUser.likeCount,
            followerCount: updatedUser.followerCount,
            followingCount: updatedUser.followingCount,
          },
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } catch (error) {
      console.error("Update user error:", error);
      return c.json({ error: "Failed to update user" }, 500);
    }
  },
);

// Get user's public images
usersRoute.get("/users/:userId/images", async (c) => {
  try {
    const userId = c.req.param("userId");
    const currentUserId = c.req.header("X-PPOI-User");
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    const db = drizzle(c.env.DB, { schema });

    // Verify user exists
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (users.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const isOwnProfile = currentUserId === userId;

    // Build where condition - show private images only for own profile
    const whereCondition = isOwnProfile
      ? eq(schema.images.userId, userId)
      : and(
          eq(schema.images.userId, userId),
          eq(schema.images.isPrivate, false),
        );

    const images = await db
      .select({
        id: schema.images.id,
        r2Key: schema.images.r2Key,
        prompt: schema.images.prompt,
        aspectRatio: schema.images.aspectRatio,
        width: schema.images.width,
        height: schema.images.height,
        likeCount: schema.images.likeCount,
        commentCount: schema.images.commentCount,
        isPrivate: schema.images.isPrivate,
        createdAt: schema.images.createdAt,
      })
      .from(schema.images)
      .where(whereCondition)
      .orderBy(desc(schema.images.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.images)
      .where(whereCondition);

    // Helper function to get image URL
    const getImageUrl = (r2Key: string): string => {
      const url = new URL(c.req.url);
      return `${url.protocol}//${url.host}/v1/serve/${r2Key}`;
    };

    // Format images with correct URLs
    const formattedImages = images.map((image) => ({
      ...image,
      url: getImageUrl(image.r2Key),
    }));

    console.log(`User ${userId} images query result:`, {
      imageCount: images.length,
      totalCount: count,
      isOwnProfile,
      currentUserId,
    });

    return c.json({
      data: formattedImages,
      pagination: {
        page,
        limit,
        total: count,
        hasMore: page * limit < count,
      },
    });
  } catch (error) {
    console.error("Get user images error:", error);
    return c.json({ error: "Failed to get user images" }, 500);
  }
});
