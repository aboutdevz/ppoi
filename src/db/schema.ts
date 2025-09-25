import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// Users table - supports both authenticated and anonymous users
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
    name: text("name").notNull(),
    handle: text("handle").unique().notNull(),
    email: text("email").unique(),
    image: text("image"),
    bio: text("bio"),
    isAnonymous: integer("is_anonymous", { mode: "boolean" })
      .default(true)
      .notNull(),

    // Cached stats - updated by triggers or background jobs
    imageCount: integer("image_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    followerCount: integer("follower_count").default(0).notNull(),
    followingCount: integer("following_count").default(0).notNull(),
  },
  (table) => ({
    handleIdx: index("users_handle_idx").on(table.handle),
    emailIdx: index("users_email_idx").on(table.email),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  }),
);

// NextAuth.js tables for authentication
export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.identifier, table.token],
    }),
  }),
);

// Images table - core content
export const images = sqliteTable(
  "images",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt"),
    model: text("model").notNull(),
    guidance: real("guidance").notNull(),
    steps: integer("steps").notNull(),
    seed: integer("seed"),
    aspectRatio: text("aspect_ratio").notNull(), // "1:1", "16:9", etc.
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    bytes: integer("bytes").notNull(),
    sha256: text("sha256").notNull(),
    r2Bucket: text("r2_bucket").notNull(),
    r2Key: text("r2_key").notNull(),
    isPrivate: integer("is_private", { mode: "boolean" })
      .default(false)
      .notNull(),

    // Remix/parent relationship
  // Self-referential parent; FK omitted to avoid TS self-reference
  parentId: text("parent_id"),

    // Cached social stats
    likeCount: integer("like_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),

    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("images_user_id_idx").on(table.userId),
    createdAtIdx: index("images_created_at_idx").on(table.createdAt),
    isPrivateIdx: index("images_is_private_idx").on(table.isPrivate),
    parentIdIdx: index("images_parent_id_idx").on(table.parentId),
    sha256Idx: index("images_sha256_idx").on(table.sha256),
  }),
);

// Tags for categorization and search
export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").unique().notNull(),
    usage_count: integer("usage_count").default(0).notNull(),
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    nameIdx: index("tags_name_idx").on(table.name),
    usageCountIdx: index("tags_usage_count_idx").on(table.usage_count),
  }),
);

// Many-to-many relationship between images and tags
export const imageTags = sqliteTable(
  "image_tags",
  {
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.imageId, table.tagId] }),
    imageIdIdx: index("image_tags_image_id_idx").on(table.imageId),
    tagIdIdx: index("image_tags_tag_id_idx").on(table.tagId),
  }),
);

// Likes for social interaction
export const likes = sqliteTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.imageId] }),
    userIdIdx: index("likes_user_id_idx").on(table.userId),
    imageIdIdx: index("likes_image_id_idx").on(table.imageId),
    createdAtIdx: index("likes_created_at_idx").on(table.createdAt),
  }),
);

// Comments for social interaction
export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(), // Pre-sanitized
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    imageIdIdx: index("comments_image_id_idx").on(table.imageId),
    userIdIdx: index("comments_user_id_idx").on(table.userId),
    createdAtIdx: index("comments_created_at_idx").on(table.createdAt),
  }),
);

// User follows for social features
export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followingId] }),
    followerIdIdx: index("follows_follower_id_idx").on(table.followerId),
    followingIdIdx: index("follows_following_id_idx").on(table.followingId),
    createdAtIdx: index("follows_created_at_idx").on(table.createdAt),
  }),
);

// Generation jobs for async processing tracking
export const generationJobs = sqliteTable(
  "generation_jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt"),
    quality: text("quality").notNull(), // "fast" | "quality"
    guidance: real("guidance").notNull(),
    steps: integer("steps").notNull(),
    seed: integer("seed"),
    aspectRatio: text("aspect_ratio").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    tags: text("tags"), // JSON array
    isPrivate: integer("is_private", { mode: "boolean" })
      .default(false)
      .notNull(),

    status: text("status").notNull(), // "pending" | "processing" | "completed" | "failed"
    error: text("error"),
    resultImageId: text("result_image_id").references(() => images.id),

    // For rate limiting context (optional)
    clientIp: text("client_ip"),
    userAgent: text("user_agent"),

    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("generation_jobs_user_id_idx").on(table.userId),
    statusIdx: index("generation_jobs_status_idx").on(table.status),
    createdAtIdx: index("generation_jobs_created_at_idx").on(table.createdAt),
    clientIpIdx: index("generation_jobs_client_ip_idx").on(table.clientIp),
  }),
);

// Audit logs for security and debugging
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(), // "login", "generate", "like", "comment", "follow", etc.
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resourceId: text("resource_id"), // imageId, commentId, etc.
    ipHash: text("ip_hash"), // Hashed IP for privacy
    userAgent: text("user_agent"),
    metadata: text("metadata"), // JSON object with additional context
    createdAt: text("created_at")
      .default(sql`(datetime('now'))`)
      .notNull(),
  },
  (table) => ({
    typeIdx: index("audit_logs_type_idx").on(table.type),
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    ipHashIdx: index("audit_logs_ip_hash_idx").on(table.ipHash),
  }),
);

// Export type inference for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type ImageTag = typeof imageTags.$inferSelect;
export type NewImageTag = typeof imageTags.$inferInsert;

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;

export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
