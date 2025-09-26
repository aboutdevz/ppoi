import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Basic configuration for Next.js frontend deployment
  // Since we have a separate API worker, we keep this minimal

  // Enable cache interception for better performance on static routes
  enableCacheInterception: true,
});
