# Environment Setup Guide

This guide helps you set up the necessary environment variables and configuration files for the ppoi project.

## Required Files

### 1. Environment Variables (.env.local)

Copy `.env.example` to `.env.local` and fill in the actual values:

```bash
cp .env.example .env.local
```

**Required variables:**

- `NEXTAUTH_SECRET`: Generate with `npm run generate:secret`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From [Google Console](https://console.developers.google.com/)
- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET`: From [Discord Developer Portal](https://discord.com/developers/applications)

**Optional variables:**

- `TURNSTILE_SECRET`: For bot protection (Cloudflare Turnstile)
- `RESEND_API_KEY`: For email notifications

### 2. Wrangler Configuration (wrangler.jsonc)

Copy `wrangler.jsonc.example` to `wrangler.jsonc` and update:

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

**Required updates:**

- `account_id`: Your Cloudflare account ID
- `database_id`: Your D1 database ID (create with `wrangler d1 create ppoi-db`)
- KV namespace `id`: Create with `wrangler kv:namespace create "KV"`
- R2 bucket: Create with `wrangler r2 bucket create ppoi-images`
- Vectorize index: Create with `wrangler vectorize create ppoi-embeddings`

## Setup Steps

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Set up Cloudflare resources:**

   ```bash
   # Create D1 database
   wrangler d1 create ppoi-db

   # Create KV namespace
   wrangler kv:namespace create "KV"

   # Create R2 bucket
   wrangler r2 bucket create ppoi-images

   # Create Vectorize index
   wrangler vectorize create ppoi-embeddings --dimensions=768 --metric=cosine
   ```

3. **Update wrangler.jsonc** with the IDs from step 2

4. **Set up database schema:**

   ```bash
   bun run migrate
   ```

5. **Start development servers:**
   ```bash
   bun dev
   ```

## OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`, `https://your-domain.com`
6. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URIs: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Client Secret

## Security Notes

- Never commit `.env.local` or `wrangler.jsonc` to version control
- Use strong, unique secrets for production
- Rotate API keys regularly
- Limit OAuth redirect URIs to your actual domains
