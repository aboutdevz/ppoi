# ppoi 🎨

> AI-powered anime profile picture generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.17.0%2B-green.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0.0%2B-black.svg)](https://bun.sh/)

A modern, full-stack application that generates AI-powered anime profile pictures using Cloudflare's AI platform. Built with Next.js 15, Cloudflare Workers, and a comprehensive social platform for sharing and discovering AI-generated art.

## ✨ Features

- 🤖 **AI-Powered Generation**: Create high-quality anime profile pictures using Cloudflare AI
- 🎭 **Multiple Quality Options**: Choose between fast and high-quality generation modes
- 🏷️ **Smart Tagging**: Automatic tag generation and custom tag support
- 🔄 **Remix System**: Remix existing images with new prompts and settings
- 👥 **Social Platform**: Like, comment, follow users, and build a community
- 🔍 **Advanced Search**: Search by images, users, prompts, and similarity
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- 🔐 **Authentication**: Google and Discord OAuth integration
- 🌐 **Internationalization**: Multi-language support ready
- ⚡ **Edge Computing**: Powered by Cloudflare's global network

## 🏗️ Architecture

### Frontend

- **Next.js 15** with App Router
- **Tailwind CSS v4** + **shadcn/ui** components
- **Framer Motion** for animations
- **NextAuth.js** for authentication
- **Zustand** for state management

### Backend

- **Cloudflare Workers** with Hono framework
- **Cloudflare D1** (SQLite) database with Drizzle ORM
- **Cloudflare R2** for image storage
- **Cloudflare AI** for image generation and embeddings
- **Cloudflare Vectorize** for similarity search
- **Cloudflare KV** for caching and rate limiting

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17.0 or higher
- **Bun** 1.0.0 or higher (recommended)
- **Cloudflare account** with Workers subscription

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ppoi-ai/ppoi.git
   cd ppoi
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Set up Cloudflare resources:**

   ```bash
   cp wrangler.jsonc.example wrangler.jsonc
   # Edit wrangler.jsonc with your Cloudflare resource IDs
   ```

5. **Create Cloudflare resources:**

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

6. **Set up the database:**

   ```bash
   bun run migrate
   ```

7. **Start development servers:**
   ```bash
   bun dev
   ```

The application will be available at:

- **Frontend**: http://localhost:3000
- **API Worker**: http://localhost:8787

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 📖 Usage

### Generating Images

1. Navigate to the **Generate** page
2. Enter your prompt (e.g., "1girl, anime style, blue hair, cyberpunk")
3. Choose quality level (Fast or High Quality)
4. Select aspect ratio
5. Add custom tags (optional)
6. Click **Generate** and wait for your AI-generated image

### Social Features

- **Like** and **comment** on images
- **Follow** other users
- **Explore** the gallery of public images
- **Search** for images by prompts, tags, or visual similarity
- **Remix** existing images with new prompts

## 🛠️ Development

### Available Scripts

```bash
# Development
bun dev              # Start both Next.js and Worker
bun dev:next         # Start only Next.js
bun dev:worker       # Start only Cloudflare Worker

# Building
bun build            # Build Next.js app
bun build:worker     # Build Worker (dry run)

# Testing
bun test             # Run unit tests
bun test:e2e         # Run end-to-end tests
bun test:coverage    # Run tests with coverage

# Database
bun run migrate      # Run database migrations
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed database with test data

# Deployment
bun deploy           # Deploy to Cloudflare
bun deploy:preview   # Deploy to preview environment

# Code Quality
bun lint             # Run ESLint
bun typecheck        # Run TypeScript checks
bun format           # Format code with Prettier
```

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── generate/        # Image generation page
│   ├── explore/         # Gallery and trending
│   ├── u/[handle]/      # User profiles
│   └── api/auth/        # NextAuth handlers
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   ├── forms/           # Form components
│   ├── gallery/         # Gallery components
│   └── social/          # Social feature components
├── worker/              # Cloudflare Worker API
│   ├── routes/          # API route handlers
│   └── lib/             # Worker utilities
├── db/                  # Database schema and types
├── lib/                 # Shared utilities
└── types/               # TypeScript type definitions
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description                 | Required |
| ----------------------- | --------------------------- | -------- |
| `NEXTAUTH_SECRET`       | NextAuth encryption secret  | ✅       |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID      | ✅       |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret  | ✅       |
| `DISCORD_CLIENT_ID`     | Discord OAuth client ID     | ✅       |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret | ✅       |
| `TURNSTILE_SECRET`      | Cloudflare Turnstile secret | ❌       |
| `RESEND_API_KEY`        | Resend email API key        | ❌       |

### Cloudflare Resources

- **AI**: For image generation and embeddings
- **D1 Database**: SQLite database for application data
- **R2 Storage**: Object storage for generated images
- **KV Storage**: Caching and rate limiting
- **Vectorize**: Vector database for similarity search

## 🚢 Deployment

### Cloudflare Pages (Frontend)

The Next.js app is automatically deployed to Cloudflare Pages:

```bash
bun build
# Deploy via Cloudflare Pages dashboard or CLI
```

### Cloudflare Workers (API)

Deploy the API worker:

```bash
bun deploy
```

For production deployment:

```bash
bun deploy:prod
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare** for the amazing AI and edge computing platform
- **Next.js** team for the excellent React framework
- **shadcn/ui** for the beautiful component library
- **Drizzle ORM** for the type-safe database toolkit

## 📞 Support

- 📧 **Email**: support@ppoi.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/ppoi-ai/ppoi/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ppoi-ai/ppoi/discussions)

---

Made with ❤️ by the ppoi team
