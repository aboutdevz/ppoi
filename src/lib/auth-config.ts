import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // TODO: Implement proper password verification
        // For now, just basic validation
        if (credentials.password.length < 6) {
          return null;
        }

        // Return user object - this will be handled by the API
        return {
          id: credentials.email, // Temporary ID
          email: credentials.email,
          name: credentials.email.split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      // Allow all sign-ins - user creation will be handled by Worker API
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Add custom fields if they exist in token
        if (token.handle) {
          session.user.handle = token.handle as string;
        }
        if (typeof token.isAnonymous === "boolean") {
          session.user.isAnonymous = token.isAnonymous;
        }
        if (token.stats) {
          session.user.stats = token.stats as {
            imageCount: number;
            likeCount: number;
            followerCount: number;
            followingCount: number;
          };
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // Store user info in token when signing in
      if (user) {
        // Will be populated by API calls later
        token.handle = undefined;
        token.isAnonymous = false;
        token.stats = {
          imageCount: 0,
          likeCount: 0,
          followerCount: 0,
          followingCount: 0,
        };
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      handle?: string;
      isAnonymous?: boolean;
      stats?: {
        imageCount: number;
        likeCount: number;
        followerCount: number;
        followingCount: number;
      };
    };
  }

  interface User {
    handle?: string;
    isAnonymous?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    handle?: string;
    isAnonymous?: boolean;
    stats?: {
      imageCount: number;
      likeCount: number;
      followerCount: number;
      followingCount: number;
    };
  }
}
