# Deployment Guide for ppoi.poipoi.click (Frontend) and ppoi-api.poipoi.click (API)

## Prerequisites

1. **Cloudflare Account** with access to:
   - Cloudflare Pages
   - Cloudflare Workers
   - Cloudflare D1 Database
   - Cloudflare R2 Storage
   - Cloudflare KV
   - Cloudflare Vectorize
   - Cloudflare AI

2. **Domain Setup**:
   - Domain `poipoi.click` should be added to your Cloudflare account
   - DNS records configured for subdomains `ppoi.poipoi.click` (frontend) and `ppoi-api.poipoi.click` (API)

## Pre-deployment Steps

### 1. Configure Environment Variables

Create production secrets in Cloudflare:

```bash
# NextAuth Secret
bunx wrangler secret put NEXTAUTH_SECRET --env production
# Enter a strong random secret (generate with: bun run generate:secret)

# OAuth Providers
bunx wrangler secret put GOOGLE_CLIENT_ID --env production
bunx wrangler secret put GOOGLE_CLIENT_SECRET --env production
bunx wrangler secret put DISCORD_CLIENT_ID --env production
bunx wrangler secret put DISCORD_CLIENT_SECRET --env production

# Optional: Turnstile (bot protection)
bunx wrangler secret put TURNSTILE_SECRET --env production

# Optional: Resend (email notifications)
bunx wrangler secret put RESEND_API_KEY --env production
```

### 2. Set up Cloudflare Resources

```bash
# Create production D1 database
bunx wrangler d1 create ppoi-db-production

# Create production KV namespace
bunx wrangler kv:namespace create "PPOI_KV" --env production

# Create production R2 bucket
bunx wrangler r2 bucket create ppoi-images-production

# Create production Vectorize index
bunx wrangler vectorize create ppoi-embeddings-production --dimensions=768 --metric=cosine
```

### 3. Update wrangler.toml with Production Resource IDs

After creating resources, update `wrangler.jsonc` with the actual resource IDs in the production section.

### 4. Run Database Migrations

```bash
# Apply migrations to production database
bun run migrate:prod
```

## Deployment Commands

### Deploy Worker API

```bash
# Deploy to production
bun run deploy

# Deploy to preview (for testing)
bun run deploy:preview
```

### Deploy Next.js Frontend (Cloudflare Pages)

1. **Connect Repository to Cloudflare Pages**:
   - Go to Cloudflare Dashboard > Pages
   - Connect your GitHub repository
   - Set build command: `bun run build`
   - Set build output directory: `.next`
   - Set root directory: `/`

2. **Configure Environment Variables in Pages**:
   - Add all variables from `.env.production`
   - Set `NODE_VERSION` to `18.17.0` or higher
   - Set `NEXT_PUBLIC_API_URL` to `https://ppoi-api.poipoi.click/v1`

3. **Custom Domain Setup**:
   - In Pages settings, add custom domain: `ppoi.poipoi.click`
   - Verify DNS records are correctly configured

## Post-deployment Verification

1. **Check Worker API**:

   ```bash
   curl https://ppoi-api.poipoi.click/v1/explore
   ```

2. **Check Frontend**:
   - Visit `https://ppoi.poipoi.click`
   - Test image generation
   - Verify authentication works

3. **Check Database**:
   ```bash
   bunx wrangler d1 execute ppoi-db-production --command "SELECT COUNT(*) FROM users;"
   ```

## Monitoring and Logs

- **Worker Logs**: `bunx wrangler tail --env production`
- **Pages Analytics**: Cloudflare Dashboard > Pages > Analytics
- **R2 Usage**: Cloudflare Dashboard > R2 > Metrics

## Rollback Plan

If issues occur:

1. **Worker Rollback**:

   ```bash
   bunx wrangler rollback --env production
   ```

2. **Pages Rollback**:
   - Go to Pages Dashboard
   - Select a previous successful deployment
   - Click "Retry deployment"

## Security Notes

- All secrets are stored in Cloudflare Workers secrets (encrypted)
- Database is accessible only through D1 API
- R2 bucket should have proper CORS and access policies
- Content Security Policy is configured in Next.js
- Rate limiting is implemented in the Worker API

## Maintenance

- **Database backups**: D1 has automatic backups
- **Image storage**: R2 has 99.999999999% durability
- **Monitor usage**: Check Cloudflare Dashboard for usage limits
- **Update dependencies**: Regular security updates via Dependabot

## Troubleshooting

### Common Issues:

1. **Worker deployment fails**: Check resource IDs in wrangler.toml
2. **Database errors**: Verify migrations ran successfully
3. **Image generation fails**: Check AI model availability and quotas
4. **CORS errors**: Verify domain configuration in worker and Next.js config
5. **Authentication issues**: Check OAuth app configurations and redirect URIs

### Debug Commands:

```bash
# Check worker logs
bunx wrangler tail --env production

# Test API endpoint
curl -X POST https://ppoi-api.poipoi.click/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "anime girl test"}'

# Check database connection
bunx wrangler d1 execute ppoi-db-production --command "SELECT 1;"
```
