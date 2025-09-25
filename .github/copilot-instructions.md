# Copilot project instructions (ppoi)

Use this guide to work effectively in this repo. Keep changes idiomatic to existing patterns and wire things end-to-end (API ↔ DB ↔ UI) when feasible.

## Architecture overview

- Frontend: Next.js 15 App Router in `src/app/**` with Tailwind v4 + shadcn/ui. Shared UI in `src/components/**`; helpers in `src/lib/**` (e.g., `utils.ts` exports `cn`).
- API: Cloudflare Worker using Hono in `src/worker`. Entry `src/worker/index.ts` registers route modules under base `/v1`:
  - Generate: `routes/generate.ts` (async job + status)
  - Images: `routes/images.ts` (details, remix, user images, delete)
  - Search: `routes/search.ts` (images/users/prompts)
  - Social: `routes/social.ts` (like/comment/follow)
  - Explore: `routes/explore.ts` (gallery + trending tags)
- Data: Cloudflare D1 via Drizzle. Schema and types in `src/db/schema.ts` (exports table objects and `$infer*` types). Migrations live in `drizzle/` and are managed via drizzle-kit.
- Infra bindings (from `wrangler.toml`):
  - DB (D1), R2 (images), KV (rate-limit), AI (Cloudflare AI), VEC (Vectorize). Image models via `IMAGE_MODEL_FAST|QUALITY`.

## Dev workflows (Bun preferred)

- Start both Next and Worker locally: `bun dev` (concurrently runs `wrangler dev --local --persist` and `next dev`).
- Migrations after schema change: `bun run migrate` (drizzle-kit generate + apply to local D1 `ppoi-db`).
- Lint/Types/Tests: `bun run lint`; `bun run typecheck`; `bun test` (Vitest), `bun run test:e2e` (Playwright UI tests if present).
- Deploy (docs-first): Pages build via `next build`; Worker configured by `wrangler.toml` (bindings must be set; see setup scripts `setup-cloudflare.*`).

## API route conventions (Hono)

- Always validate inputs with `@hono/zod-validator` (see `generate.ts` schemas). Return JSON; set useful headers (e.g., X-RateLimit-\*).
- Access DB with `drizzle(c.env.DB, { schema })`. Use `sql\`...\``for atomic counters (e.g.,`likeCount` inc/dec).
- IDs via `nanoid()`. Timestamps as ISO strings. Background work via `c.executionCtx.waitUntil(...)`.
- Rate limit keys in KV: `rate_limit:{user|anon}:{window}`. Anonymous key is SHA-256 hash of `CF-Connecting-IP` (see `generate.ts`).
- Images stored in R2 with key `images/YYYY/MM/{id}.png`. Images are served via worker endpoint `/v1/serve/${r2Key}` which proxies from R2 bucket.

## Database patterns

- Tables: users, images, tags, imageTags, likes, comments, follows, generationJobs, auditLogs (+ NextAuth tables).
- Keep counters denormalized on parent rows (users.imageCount, images.likeCount, etc.) and update via SQL expressions.
- Add columns/tables in `src/db/schema.ts` → run `bun run migrate`. Use exported `type NewX`/`X` for inserts/selects.

## Auth and identity

- NextAuth handler at `src/app/api/auth/[...nextauth]/route.ts` with options in `src/lib/auth.ts` (DrizzleAdapter). The current `getDb()` is a placeholder for dev; real Worker code uses `drizzle(c.env.DB, { schema })`.
- Worker endpoints expect an optional `X-PPOI-User` header to associate actions to a user until full auth wiring is finalized.

## Adding features quickly

- New Worker endpoint: create `src/worker/routes/feature.ts` exporting `const featureRoute = new Hono...`; register in `src/worker/index.ts` via `app.route("/v1", featureRoute)`.
- Persisting data: import `* as schema` from `src/db/schema.ts`, construct `New*` objects, set `createdAt/updatedAt`, and use Drizzle. Follow remap examples in `images.ts` and `social.ts`.
- UI: build pages/components under `src/app/**` and `src/components/**`; prefer existing primitives in `src/components/ui/*` and the `cn()` util.

## Useful examples

- POST /v1/generate body: `{ "prompt": "1girl, anime pfp", "quality": "fast", "aspectRatio": "1:1", "tags": ["cyberpunk"] }` → returns `{ jobId, status: "pending" }`; poll `/v1/generate/status/:jobId`.
- Image delete flow: `DELETE /v1/:imageId` with `X-PPOI-User` header; also removes from R2 and decrements `users.imageCount`.

Keep responses consistent (shapes, URLs, counters). Prefer small, composable route modules and colocated schema queries. When unsure, mirror patterns from the closest existing route.

## Goal-mapped implementation notes

1. Generator (UI ↔ API): `src/app/generate/page.tsx` POSTs to `/v1/generate` with zod-validated payload; status polled via `/v1/generate/status/:jobId`. Anonymous users are created auto in `routes/generate.ts` when `X-PPOI-User` missing.
2. Prompt Remix: Persist prompt/settings in `images` + R2 `customMetadata`; set `images.parentId`. Implement `/v1/remix` in `routes/images.ts` to call `processGenerationJob(c.env, jobId)` and, on completion, store `parentId` on the new image.
3. Auto-tagging: After job completes, run a background step via `executionCtx.waitUntil` using `env.AI.run(...)` to derive tags; upsert `tags` and `imageTags`. Reuse `processTags()`.
4. Explore/Gallery: Public listing in `/v1/explore` with pagination; keep `isPrivate=false`. UI uses Next Image + lazy loading; cache responses in KV with short TTL and invalidate on image create/delete.
5. Similarity Search: On insert, compute prompt embeddings via `env.AI.run(EMBEDDING_MODEL)` and `env.VEC.upsert({ id, imageId, values })`. Extend `/v1/search` with `type="similar"` using `env.VEC.query` then hydrate from D1.
6. Profiles & Settings: Add pages under `src/app/u/[handle]` and `src/app/settings/**` to edit `users`. Maintain denormalized counters on mutations (see `social.ts` patterns).
7. Security: Sanitize user content with `isomorphic-dompurify`; keep Worker responses plain text/JSON. Tighten CORS in Worker for prod domains; add CSP/HSTS in `next.config.ts` headers.
8. Performance: Use pagination and minimal selects; Next Image optimization; KV caching for explore/search; Cloudflare CDN for public pages.
9. SEO: Per-page `generateMetadata`; extend `sitemap.ts` to enumerate image URLs with `lastmod`; OG tags for image detail pages.
10. i18n: Use `next-intl` and wrap providers in `src/components/providers`; colocate translation keys with components.
11. Tests: Vitest unit (components/helpers), integration for Worker routes with mocked Drizzle; e2e (Playwright) for generate → status → view → remix. Scripts: `bun test`, `bun run test:e2e`.
