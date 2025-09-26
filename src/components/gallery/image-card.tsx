"use client";

import * as React from "react";
import { useState, useEffect } from "react";
// Using regular img for direct API image serving
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Share2, Download, Eye, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LikeButton } from "@/components/social/like-button";
// import { RemixButton } from "@/components/remix/remix-dialog"; // Hidden

interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    handle: string;
    image?: string;
    isAnonymous: boolean;
  };
  tags: string[];
  isLiked?: boolean;
}

interface ImageCardProps {
  image: GalleryImage;
  showUser?: boolean;
  priority?: boolean;
  // onRemix?: (imageId: string, jobId: string) => void; // Hidden
}

export function ImageCard({
  image,
  showUser = true,
  priority = false,
}: ImageCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this anime art: ${image.prompt.slice(0, 50)}...`,
          url: `/i/${image.id}`,
        });
      } catch {
        // Fallback to clipboard
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/i/${image.id}`,
      );
      // Could show toast notification here
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `ppoi-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Card className="overflow-hidden border-border/40 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden">
            {!isImageLoaded && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <Link href={`/i/${image.id}`} className="block relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.prompt}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setIsImageLoaded(true)}
                loading={priority ? "eager" : "lazy"}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <Eye className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">View Details</p>
                </div>
              </div>
            </Link>

            {/* Action Buttons Overlay */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  handleDownload();
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  handleShare();
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Tags Overlay */}
            {image.tags.length > 0 && (
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-wrap gap-1 max-w-40">
                  {image.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-background/80 backdrop-blur-sm"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {image.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-background/80 backdrop-blur-sm"
                    >
                      +{image.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* User Info */}
            {showUser && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={image.user.image} />
                  <AvatarFallback className="text-xs">
                    {image.user.isAnonymous ? "A" : image.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/u/${image.user.handle}`}
                  className="text-sm font-medium hover:text-brand-primary transition-colors truncate"
                >
                  {image.user.name}
                </Link>
                {image.user.isAnonymous && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    Anonymous
                  </Badge>
                )}
              </div>
            )}

            {/* Prompt */}
            <div>
              <p className="text-sm text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                {image.prompt}
              </p>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Like Button */}
                <LikeButton
                  imageId={image.id}
                  initialLiked={image.isLiked ?? false}
                  initialLikeCount={image.likeCount}
                />

                {/* Comments */}
                <Link
                  href={`/i/${image.id}#comments`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{image.commentCount}</span>
                </Link>
              </div>

              {/* Remix Button - Hidden */}
              {/* <RemixButton
                imageId={image.id}
                originalPrompt={image.prompt}
                originalTags={image.tags}
                onRemixStarted={(jobId) => onRemix?.(image.id, jobId)}
              /> */}
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(image.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{image.aspectRatio}</span>
                <span>•</span>
                <span>{image.model}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ImageGridProps {
  images: GalleryImage[];
  loading?: boolean;
  // onRemix?: (imageId: string, jobId: string) => void; // Hidden
  showUser?: boolean;
  className?: string;
}

export function ImageGrid({
  images,
  loading,
  // onRemix, // Hidden
  showUser = true,
  className = "",
}: ImageGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      <AnimatePresence>
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            // onRemix={onRemix} // Hidden
            showUser={showUser}
            priority={index < 8} // Priority load for first 8 images
          />
        ))}
      </AnimatePresence>

      {/* Loading Skeletons */}
      {loading && (
        <>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={`loading-${i}`} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// Masonry layout version for better visual appeal
export function MasonryImageGrid({
  images,
  loading,
  // onRemix, // Hidden
  showUser = true,
  className = "",
}: ImageGridProps) {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else if (width < 1280) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Split images into columns
  const columnArrays = Array.from(
    { length: columns },
    () => [] as GalleryImage[],
  );
  images.forEach((image, index) => {
    columnArrays[index % columns].push(image);
  });

  return (
    <div
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {columnArrays.map((columnImages, columnIndex) => (
        <div key={columnIndex} className="space-y-6">
          <AnimatePresence>
            {columnImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                // onRemix={onRemix} // Hidden
                showUser={showUser}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}

      {/* Loading skeletons distributed across columns */}
      {loading &&
        columnArrays.map((_, columnIndex) => (
          <div key={`loading-column-${columnIndex}`} className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card
                key={`loading-${columnIndex}-${i}`}
                className="overflow-hidden"
              >
                <CardContent className="p-0">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
}
