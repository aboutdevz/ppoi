import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OpenNext will handle the build output
  // output: "standalone", // Removed for OpenNext compatibility

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
      // Development: localhost worker
      {
        protocol: "http",
        hostname: "localhost",
        port: "8787",
        pathname: "/v1/serve/**",
      },
      // Production: ppoi-api.poipoi.click worker API
      {
        protocol: "https",
        hostname: "ppoi-api.poipoi.click",
        port: "",
        pathname: "/v1/serve/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    webpackBuildWorker: true,
    optimizeCss: true,
    // Turbopack configuration
    turbo: {
      rules: {
        // Custom loader rules for Turbopack
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
      resolveAlias: {
        // Resolve aliases for better performance
        "@": "./src",
        "@/components": "./src/components",
        "@/lib": "./src/lib",
        "@/db": "./src/db",
        "@/types": "./src/types",
      },
    },
  },

  // Webpack configuration
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },

  // Environment variables for runtime
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
