"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageCircle,
  Share2,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Palette,
  Settings,
  MoreHorizontal,
  Flag,
  Eye,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { Comments } from "@/components/social/comments";
import { LikeButton } from "@/components/social/like-button";
// import { RemixButton } from "@/components/remix/remix-dialog"; // Hidden
import { api } from "@/lib/api";

interface ImageDetails {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  guidance: number;
  steps: number;
  seed?: number;
  aspectRatio: string;
  width: number;
  height: number;
  isPrivate: boolean;
  parentId?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  tags: string[];
  isLiked: boolean;
  user: {
    id: string;
    name: string;
    handle: string;
    image?: string;
    isAnonymous: boolean;
  };
}

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const imageId = params.id as string;

  const [image, setImage] = useState<ImageDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (imageId) {
      loadImageDetails(imageId);
    }
  }, [imageId]);

  const loadImageDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await api.getImageDetails(id);
      setImage(response.image);
    } catch (error) {
      console.error("Failed to load image details:", error);
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 404
      ) {
        toast.error("Image not found");
      } else {
        toast.error("Failed to load image details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!image) return;

    try {
      const shareUrl = `${window.location.origin}/i/${image.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `Amazing anime art by ${image.user.name}`,
          text: `Check out this stunning creation: "${image.prompt.slice(0, 100)}..."`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Failed to share image");
    }
  };

  const handleDownload = async () => {
    if (!image) return;

    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ppoi-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy prompt");
    }
  };

  const handleReport = () => {
    toast.info("Report functionality coming soon!");
  };

  const handleDelete = async () => {
    if (!image || image.user.id !== session?.user?.id) return;

    if (
      confirm(
        "Are you sure you want to delete this image? This action cannot be undone.",
      )
    ) {
      try {
        await api.deleteImage(image.id);
        toast.success("Image deleted successfully");
        router.push("/explore");
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete image");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container py-8 mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <Card className="border-border/40 bg-background/50 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Image not found</h2>
            <p className="text-muted-foreground mb-6">
              The image you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/explore">Browse Gallery</Link>
              </Button>
              <Button asChild>
                <Link href="/generate">Create New</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnImage = image.user.id === session?.user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto space-y-8">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {image.aspectRatio}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {image.width} × {image.height}
            </Badge>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Display */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-border/40 bg-background/50 backdrop-blur-sm overflow-hidden">
              <div className="relative group">
                <div className="w-full aspect-square relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={`Anime art: ${image.prompt.slice(0, 100)}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Action Buttons Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    size="sm"
                    className="bg-black/80 text-white hover:bg-black/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="secondary"
                    size="sm"
                    className="bg-black/80 text-white hover:bg-black/90"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Details Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Creator Info */}
            <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Link
                    href={`/u/${image.user.handle}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={image.user.image} />
                      <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-magenta text-white">
                        {image.user.isAnonymous ? "A" : image.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{image.user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        @{image.user.handle}
                      </p>
                    </div>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwnImage ? (
                        <>
                          <DropdownMenuItem onClick={handleDelete}>
                            Delete Image
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={handleReport}>
                            <Flag className="w-4 h-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Social Actions */}
                <div className="flex items-center gap-4 mb-4">
                  <LikeButton
                    imageId={image.id}
                    initialLiked={image.isLiked}
                    initialLikeCount={image.likeCount}
                  />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{image.commentCount}</span>
                  </div>
                  {/* <RemixButton
                    imageId={image.id}
                    originalPrompt={image.prompt}
                    originalTags={image.tags}
                    onRemixStarted={(jobId) =>
                      toast.success(`Remix started! Job ID: ${jobId}`)
                    }
                  /> */}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(image.createdAt)}</span>
                  </div>
                  {image.isPrivate && (
                    <Badge variant="outline" className="text-xs">
                      Private
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details and Comments Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Comments ({image.commentCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette className="w-5 h-5 text-brand-primary" />
                      Generation Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Prompt</label>
                        <Button
                          onClick={() => handleCopyPrompt(image.prompt)}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded-lg leading-relaxed">
                        {image.prompt}
                      </p>
                    </div>

                    {/* Negative Prompt */}
                    {image.negativePrompt && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Negative Prompt
                          </label>
                          <Button
                            onClick={() =>
                              handleCopyPrompt(image.negativePrompt || "")
                            }
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg leading-relaxed text-muted-foreground">
                          {image.negativePrompt}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Technical Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-muted-foreground">Model</label>
                        <p className="font-medium">{image.model}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">
                          Guidance
                        </label>
                        <p className="font-medium">{image.guidance}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Steps</label>
                        <p className="font-medium">{image.steps}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Seed</label>
                        <p className="font-medium">{image.seed || "Random"}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {image.tags.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {image.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Parent/Remix Info */}
                    {image.parentId && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="w-4 h-4" />
                          <span>This is a remix of another image</span>
                          <Link
                            href={`/i/${image.parentId}`}
                            className="text-brand-primary hover:underline"
                          >
                            View Original
                          </Link>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <Comments imageId={image.id} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
