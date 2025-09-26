"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { ImageGrid } from "@/components/gallery/image-card";

type SortOption = "recent" | "popular" | "trending";
type FilterOption = "all" | "1:1" | "16:9" | "9:16" | "4:3";

interface ExploreImage {
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

interface TrendingTag {
  name: string;
  count: number;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ExploreImage[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingImages, setLoadingImages] = useState(true);

  const loadImages = useCallback(
    async (pageNum: number = 1, replace: boolean = false) => {
      try {
        setLoadingImages(true);
        const aspectRatio = filterBy === "all" ? undefined : filterBy;

        const response = await api.getExploreImages({
          page: pageNum,
          limit: 20,
          sortBy,
          aspectRatio,
        });

        if (replace) {
          setImages(response.data);
        } else {
          setImages((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load images:", error);
        toast.error("Failed to load images. Please try again.");
      } finally {
        setLoadingImages(false);
      }
    },
    [sortBy, filterBy],
  );

  // Load images on component mount and when filters change
  useEffect(() => {
    loadImages(1, true);
  }, [sortBy, filterBy, loadImages]);

  // Load trending tags on component mount
  useEffect(() => {
    loadTrendingTags();
  }, []);

  const loadTrendingTags = async () => {
    try {
      const response = await api.getTrendingTags(10);
      setTrendingTags(response.tags);
    } catch (error) {
      console.error("Failed to load trending tags:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If empty search, reload regular explore images
      loadImages(1, true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.searchImages(searchQuery.trim(), {
        page: 1,
        limit: 20,
      });

      setImages(response.data);
      setHasMore(response.pagination.hasMore);
      setPage(1);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreImages = () => {
    if (hasMore && !loadingImages && !isLoading) {
      if (searchQuery.trim()) {
        // Load more search results
        handleSearchMore();
      } else {
        // Load more explore images
        loadImages(page + 1, false);
      }
    }
  };

  const handleSearchMore = async () => {
    try {
      setIsLoading(true);
      const response = await api.searchImages(searchQuery.trim(), {
        page: page + 1,
        limit: 20,
      });

      const imageResults = response.results
        .filter((result) => result.type === "image")
        .map((result) => ({
          id: result.id,
          url: result.url || "",
          prompt: result.prompt || "",
          model: "Unknown",
          aspectRatio: result.aspectRatio || "1:1",
          width: 1024,
          height: 1024,
          likeCount: result.likeCount || 0,
          commentCount: result.commentCount || 0,
          createdAt: result.createdAt || "",
          user: {
            id: result.user?.id || "",
            name: result.user?.name || "Unknown",
            handle: result.user?.handle || "unknown",
            image: result.user?.image,
            isAnonymous: result.user?.isAnonymous || false,
          },
          tags: result.tags || [],
          isLiked: false,
        })) as ExploreImage[];

      setImages((prev) => [...prev, ...imageResults]);
      setHasMore(response.pagination.hasNext);
      setPage(page + 1);
    } catch (error) {
      console.error("Load more search failed:", error);
      toast.error("Failed to load more results.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimilaritySearch = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await api.findSimilarImages(query, {
        page: 1,
        limit: 20,
      });

      const imageResults = response.results
        .filter((result) => result.type === "image")
        .map((result) => ({
          id: result.id,
          url: result.url || "",
          prompt: result.prompt || "",
          model: "Unknown",
          aspectRatio: result.aspectRatio || "1:1",
          width: 1024,
          height: 1024,
          likeCount: result.likeCount || 0,
          commentCount: result.commentCount || 0,
          createdAt: result.createdAt || "",
          user: {
            id: result.user?.id || "",
            name: result.user?.name || "Unknown",
            handle: result.user?.handle || "unknown",
            image: result.user?.image,
            isAnonymous: result.user?.isAnonymous || false,
          },
          tags: result.tags || [],
          isLiked: false,
          similarity: result.similarity,
        })) as ExploreImage[];

      setImages(imageResults);
      setHasMore(response.pagination.hasNext);
      setPage(1);
      toast.success(`Found ${imageResults.length} similar images!`);
    } catch (error) {
      console.error("Similarity search failed:", error);
      toast.error("Similarity search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              Explore{" "}
              <span className="bg-gradient-to-r from-brand-primary via-brand-magenta to-brand-cyan bg-clip-text text-transparent">
                Community
              </span>{" "}
              Creations
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover amazing AI-generated anime art from our creative
              community. Get inspired and find your next favorite character
              design.
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by prompt, tags, or creator..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </form>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={sortBy}
                      onValueChange={(value: SortOption) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={filterBy}
                      onValueChange={(value: FilterOption) =>
                        setFilterBy(value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratios</SelectItem>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="16:9">Landscape</SelectItem>
                        <SelectItem value="9:16">Portrait</SelectItem>
                        <SelectItem value="4:3">Classic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {searchQuery.trim() && (
                    <Button
                      variant="outline"
                      onClick={() => handleSimilaritySearch(searchQuery.trim())}
                      disabled={isLoading}
                      className="hover:bg-brand-primary/10 hover:border-brand-primary/50"
                    >
                      Find Similar Images
                    </Button>
                  )}
                </div>

                {/* Trending Tags */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.slice(0, 8).map((tag) => (
                      <Button
                        key={tag.name}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(tag.name)}
                        className="text-xs hover:bg-brand-primary/10 hover:border-brand-primary/50"
                      >
                        #{tag.name} ({tag.count})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {images.length} image{images.length !== 1 ? "s" : ""} found
              </h2>
            </div>

            {/* Loading State */}
            {loadingImages && images.length === 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card
                    key={i}
                    className="border-border/40 bg-background/50 backdrop-blur-sm animate-pulse"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-muted rounded-full" />
                          <div className="h-4 w-20 bg-muted rounded" />
                        </div>
                        <div className="h-4 w-full bg-muted rounded" />
                        <div className="h-4 w-3/4 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Image Grid */}
            <ImageGrid
              images={images.map((img) => ({
                ...img,
                model: img.model || "Unknown",
                width: img.width || 1024,
                height: img.height || 1024,
                user: {
                  ...img.user,
                  isAnonymous: img.user.isAnonymous ?? false,
                },
              }))}
              loading={loadingImages && images.length === 0}
            />

            {/* Load More */}
            {images.length > 0 && hasMore && !loadingImages && (
              <div className="text-center pt-8">
                <Button
                  onClick={loadMoreImages}
                  variant="outline"
                  size="lg"
                  className="hover:bg-brand-primary/10 hover:border-brand-primary/50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Load More Images
                </Button>
              </div>
            )}

            {/* No Results */}
            {images.length === 0 && !loadingImages && (
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No images found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterBy("all");
                      setSortBy("recent");
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
