import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  WebsiteSchema,
  OrganizationSchema,
  WebApplicationSchema,
} from "@/components/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ppoi - AI Anime Profile Picture Generator",
    template: "%s | ppoi",
  },
  description:
    "Create stunning AI-generated anime profile pictures with advanced AI technology. Join the community and share your creations.",
  keywords: [
    "AI",
    "anime",
    "profile picture",
    "generator",
    "artificial intelligence",
    "art",
    "avatar",
    "character",
    "manga",
    "illustration",
  ],
  authors: [
    {
      name: "ppoi team",
      url: "https://ppoi.app",
    },
  ],
  creator: "ppoi",
  publisher: "ppoi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ppoi.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ppoi.app",
    title: "ppoi - AI Anime Profile Picture Generator",
    description:
      "Create stunning AI-generated anime profile pictures with advanced AI technology. Join the community and share your creations.",
    siteName: "ppoi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ppoi - AI Anime Profile Picture Generator",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <WebsiteSchema />
        <OrganizationSchema />
        <WebApplicationSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
