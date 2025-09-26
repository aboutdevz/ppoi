"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Heart, Lock, LogIn, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageCard } from "@/components/gallery/image-card";
import { api } from "@/lib/api";

interface LikedImage {
  id: string;
  prompt: string;
  url: string;
  aspectRatio: string;
  width: number;
  height: number;
  model: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedAt: string;
  user: {
    id: string;
    name: string;
    handle: string;
    image?: string;
    isAnonymous: boolean;
  };
}

export default function LikedPage() {
  const { data: session, status } = useSession();
  const [likedImages, setLikedImages] = React.useState<LikedImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [hasNext, setHasNext] = React.useState(false);

  const isAuthenticated = status === "authenticated" && session?.user;

  const fetchLikedImages = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Set the user header for API calls
      const response = await api.getUserLikedImages({ page, limit: 20 });

      if (page === 1) {
        setLikedImages(response.images);
      } else {
        setLikedImages((prev) => [...prev, ...response.images]);
      }

      setHasNext(response.pagination.hasNext);
    } catch (err) {
      console.error("Failed to fetch liked images:", err);
      setError("Failed to load your liked images. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Fetch liked images
  React.useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      fetchLikedImages();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [isAuthenticated, session?.user?.id, status, fetchLikedImages]);

  const loadMore = () => {
    if (hasNext && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container max-w-md"
        >
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-primary to-brand-magenta rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Sign in to view your liked images and manage your favorites.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1 bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button variant="outline" className="flex-1">
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your{" "}
              <span className="bg-gradient-to-r from-brand-primary via-brand-magenta to-brand-cyan bg-clip-text text-transparent">
                Liked
              </span>{" "}
              Images
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All the anime art you&apos;ve fallen in love with, saved in one
              place.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <Card className="border-destructive/40 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchLikedImages} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && likedImages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="aspect-square animate-pulse">
                  <CardContent className="p-0 h-full bg-muted rounded-lg" />
                </Card>
              ))}
            </div>
          )}

          {/* Images Grid */}
          {!loading && likedImages.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {likedImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={{
                      id: image.id,
                      prompt: image.prompt,
                      url: image.url,
                      aspectRatio: image.aspectRatio,
                      width: image.width,
                      height: image.height,
                      model: image.model,
                      likeCount: image.likeCount,
                      commentCount: image.commentCount,
                      createdAt: image.createdAt,
                      user: image.user,
                      tags: [], // TODO: Add tags from backend
                      isLiked: true, // All images in liked page are liked
                    }}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasNext && (
                <div className="text-center">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && likedImages.length === 0 && (
            <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No liked images yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start exploring the community to find images you love
                </p>
                <Button asChild variant="outline">
                  <Link href="/explore">Explore Gallery</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
