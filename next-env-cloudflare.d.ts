// Cloudflare environment types for Next.js
declare global {
  namespace CloudflareEnv {
    interface Env {
      // Assets binding for static files
      ASSETS: {
        fetch: (request: Request) => Promise<Response>;
      };

      // Environment variables
      NEXT_PUBLIC_API_URL: string;
      NODE_ENV: "development" | "production" | "test";

      // Optional: If you want to access Cloudflare bindings from Next.js
      // Note: These would be available in API routes and server components
      KV?: KVNamespace;
      DB?: D1Database;
      R2?: R2Bucket;
      AI?: Ai;
      VEC?: VectorizeIndex;
    }
  }

  // Extend NodeJS global to include Cloudflare environment
  var process: {
    env: CloudflareEnv.Env;
  };
}

export {};
