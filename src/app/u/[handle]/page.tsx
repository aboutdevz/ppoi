"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Heart,
  Image as ImageIcon,
  Users,
  Settings,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ImageGrid } from "@/components/gallery/image-card";
import { FollowButton } from "@/components/social/follow-button";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  handle: string;
  image?: string;
  bio?: string;
  isAnonymous: boolean;
  stats: {
    imageCount: number;
    likeCount: number;
    followerCount: number;
    followingCount: number;
  };
  createdAt: string;
  isFollowing: boolean;
  canViewFull: boolean;
  email?: string; // Only present for own profile
}

interface UserImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  width: number;
  height: number;
  likeCount: number;
  commentCount: number;
  isPrivate: boolean;
  createdAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const handle = params.handle as string;
  const { data: session } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("images");

  useEffect(() => {
    if (handle) {
      loadUserProfile(handle);
    }
  }, [handle]);

  // Set user token for API calls when session changes
  useEffect(() => {
    if (session?.user?.id) {
      api.setUserToken(session.user.id);
    } else {
      api.setUserToken(null);
    }
  }, [session]);

  const loadUserProfile = async (userHandle: string) => {
    try {
      setIsLoading(true);
      const response = await api.getUserByHandle(userHandle);
      console.log("User profile loaded:", response);
      setProfile(response);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast.error("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserImages = useCallback(
    async (pageNum: number = 1, replace: boolean = false) => {
      if (!profile) {
        console.log("loadUserImages called but no profile");
        return;
      }

      console.log(
        "Loading user images for profile:",
        profile.id,
        "page:",
        pageNum,
      );

      try {
        setImagesLoading(true);
        const response = await api.getUserImages(profile.id, pageNum, 20);

        console.log("getUserImages response:", response);

        if (replace) {
          setImages(response.data);
        } else {
          setImages((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load user images:", error);
        toast.error("Failed to load images");
      } finally {
        setImagesLoading(false);
      }
    },
    [profile],
  );

  useEffect(() => {
    if (profile && activeTab === "images") {
      console.log(
        "Loading images for profile:",
        profile.id,
        "session user:",
        session?.user?.id,
      );
      loadUserImages(1, true);
    }
  }, [profile, activeTab, loadUserImages, session?.user?.id]);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/u/${handle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} on ppoi`,
          text: `Check out ${profile?.name}'s anime art creations on ppoi!`,
          url: profileUrl,
        });
      } catch {
        handleCopyLink(profileUrl);
      }
    } else {
      handleCopyLink(profileUrl);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container py-8 mx-auto">
          <div className="space-y-8 animate-pulse">
            <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-32 h-32 bg-muted rounded-full mx-auto md:mx-0" />
                  <div className="flex-1 space-y-4">
                    <div className="h-8 bg-muted rounded w-48 mx-auto md:mx-0" />
                    <div className="h-4 bg-muted rounded w-32 mx-auto md:mx-0" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="flex gap-4 justify-center md:justify-start">
                      <div className="h-6 bg-muted rounded w-20" />
                      <div className="h-6 bg-muted rounded w-20" />
                      <div className="h-6 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <Card className="border-border/40 bg-background/50 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <p className="text-muted-foreground mb-6">
              The user profile you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Button asChild>
              <a href="/explore">Browse Gallery</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <Avatar className="w-32 h-32 border-4 border-border">
                    <AvatarImage src={profile.image} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-brand-primary to-brand-magenta text-white">
                      {profile.isAnonymous ? "A" : profile.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center md:justify-start gap-2">
                      {profile.name}
                      {profile.isAnonymous && (
                        <Badge variant="outline" className="text-xs">
                          Anonymous
                        </Badge>
                      )}
                    </h1>
                    <p className="text-muted-foreground">@{profile.handle}</p>
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-6 justify-center md:justify-start">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4 text-brand-primary" />
                        <span className="font-semibold">
                          {profile.stats.imageCount}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Images
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-semibold">
                          {profile.stats.likeCount}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Likes
                      </span>
                    </div>
                    <a
                      href={`/u/${profile.handle}/followers`}
                      className="text-center hover:text-brand-primary transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">
                          {profile.stats.followerCount}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Followers
                      </span>
                    </a>
                    <a
                      href={`/u/${profile.handle}/following`}
                      className="text-center hover:text-brand-primary transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="font-semibold">
                          {profile.stats.followingCount}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Following
                      </span>
                    </a>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(profile.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    {isOwnProfile ? (
                      <Button
                        asChild
                        className="bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white"
                      >
                        <a href="/settings">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </a>
                      </Button>
                    ) : (
                      <FollowButton
                        userId={profile.id}
                        initialIsFollowing={profile.isFollowing}
                        initialFollowerCount={profile.stats.followerCount}
                        onFollowChange={(isFollowing, followerCount) => {
                          setProfile((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  isFollowing,
                                  stats: { ...prev.stats, followerCount },
                                }
                              : null,
                          );
                        }}
                        variant="default"
                        className="bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white"
                      />
                    )}

                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 lg:w-fit lg:grid-cols-2">
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images ({profile.stats.imageCount})
              </TabsTrigger>
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Liked
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="mt-6">
              {images.length === 0 && !imagesLoading ? (
                <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No images yet</h3>
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile
                        ? "Start creating to see your artwork here!"
                        : "This user hasn't shared any images yet."}
                    </p>
                    {isOwnProfile && (
                      <Button asChild className="mt-4">
                        <a href="/generate">Create Your First Image</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <ImageGrid
                  images={images.map((img) => ({
                    ...img,
                    model: "Unknown",
                    user: {
                      id: profile.id,
                      name: profile.name,
                      handle: profile.handle,
                      image: profile.image,
                      isAnonymous: profile.isAnonymous,
                    },
                    tags: [],
                    isLiked: false,
                  }))}
                  loading={imagesLoading}
                  showUser={false}
                />
              )}

              {/* Load More Images */}
              {hasMore && images.length > 0 && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => loadUserImages(page + 1, false)}
                    disabled={imagesLoading}
                    variant="outline"
                    size="lg"
                    className="hover:bg-brand-primary/10 hover:border-brand-primary/50"
                  >
                    {imagesLoading ? "Loading..." : "Load More Images"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked" className="mt-6">
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Liked images</h3>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile
                      ? "Your liked images will appear here."
                      : "This user's liked images are private."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
