import { Hono } from "hono";
import type {
  D1Database,
  R2Bucket,
  KVNamespace,
  VectorizeIndex,
  Ai,
} from "@cloudflare/workers-types";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { timing } from "hono/timing";

import { generateRoute } from "./routes/generate";
import { imagesRoute } from "./routes/images";
import { searchRoute } from "./routes/search";
import { socialRoute } from "./routes/social";
import { exploreRoute } from "./routes/explore";
import { usersRoute } from "./routes/users";

export interface Env {
  AI: Ai;
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  VEC: VectorizeIndex;

  // Environment variables
  VECTORIZE_INDEX: string;
  EMBEDDING_MODEL: string;
  IMAGE_MODEL_FAST: string;
  IMAGE_MODEL_QUALITY: string;

  // Optional secrets
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  NEXTAUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use("*", timing());

// Security headers middleware
app.use("*", async (c, next) => {
  await next();

  // Add security headers
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Add CSP for API responses
  if (c.req.path.startsWith("/v1/")) {
    c.header(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none';",
    );
  }
});
app.use(
  "*",
  cors({
    origin: (origin) => {
      // In development, allow localhost and 127.0.0.1
      if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
        return origin;
      }
      // In production, restrict to your actual domains
      if (
        origin?.includes("pages.dev") ||
        origin?.includes("ppoi.poipoi.click") ||
        origin?.includes("poipoi.click")
      ) {
        return origin;
      }
      // Allow requests without origin (e.g., mobile apps, Postman)
      if (!origin) return "*";
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-PPOI-User",
      "X-Internal-API",
    ],
    credentials: true,
  }),
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "ppoi-api",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/v1/health", (c) => {
  return c.json({
    ok: true,
    services: {
      ai: "available",
      database: "connected",
      storage: "ready",
      cache: "active",
      vectorize: "initialized",
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes (order matters - specific routes before parameterized routes)
app.route("/v1", generateRoute);
app.route("/v1", exploreRoute);
app.route("/v1", searchRoute);
app.route("/v1", socialRoute);
app.route("/v1", usersRoute);
app.route("/v1", imagesRoute); // Keep images last since it has /:imageId catch-all

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: "The requested endpoint does not exist",
      path: c.req.path,
    },
    404,
  );
});

// Error Handler
app.onError((err, c) => {
  console.error("Worker error:", err);

  return c.json(
    {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    },
    500,
  );
});

export default app;
