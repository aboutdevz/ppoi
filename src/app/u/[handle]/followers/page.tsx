"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Users, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/components/social/follow-button";

import { api } from "@/lib/api";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  handle: string;
  image?: string;
  bio?: string;
  isAnonymous: boolean;
  isFollowing: boolean;
  stats: {
    imageCount: number;
    followerCount: number;
    followingCount: number;
  };
  followedAt: string;
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const { data: session } = useSession();

  const [profileUser, setProfileUser] = useState<{
    id: string;
    name: string;
    handle: string;
  } | null>(null);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0,
  });

  useEffect(() => {
    if (handle) {
      loadProfileAndFollowers(handle);
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

  const loadProfileAndFollowers = async (userHandle: string) => {
    try {
      setIsLoading(true);

      // First get the user profile to get their ID
      const profileResponse = await api.getUserByHandle(userHandle);
      setProfileUser(profileResponse);

      // Then get their followers
      const followersResponse = await api.getFollowers(
        profileResponse.id,
        1,
        20,
      );
      setFollowers(followersResponse.users);
      setPagination({
        page: followersResponse.pagination.page,
        hasMore: followersResponse.pagination.hasMore,
        total: followersResponse.pagination.total,
      });
    } catch (error) {
      console.error("Failed to load followers:", error);
      toast.error("Failed to load followers");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreFollowers = async () => {
    if (!profileUser || loadingMore || !pagination.hasMore) return;

    try {
      setLoadingMore(true);
      const response = await api.getFollowers(
        profileUser.id,
        pagination.page + 1,
        20,
      );

      setFollowers((prev) => [...prev, ...response.users]);
      setPagination({
        page: response.pagination.page,
        hasMore: response.pagination.hasMore,
        total: response.pagination.total,
      });
    } catch (error) {
      console.error("Failed to load more followers:", error);
      toast.error("Failed to load more followers");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setFollowers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing } : user,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container py-8 mx-auto">
          <div className="space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="h-8 bg-muted rounded w-48" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="border-border/40 bg-background/50 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-32" />
                      <div className="h-4 bg-muted rounded w-24" />
                    </div>
                    <div className="w-20 h-9 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <Card className="border-border/40 bg-background/50 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">User not found</h2>
            <p className="text-muted-foreground mb-6">
              The user profile you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/explore">Browse Gallery</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-brand-primary" />
              {profileUser.name}&apos;s Followers
            </h1>
            <p className="text-muted-foreground">
              {pagination.total}{" "}
              {pagination.total === 1 ? "follower" : "followers"}
            </p>
          </div>
        </motion.div>

        {/* Followers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          {followers.length === 0 ? (
            <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No followers yet</h3>
                <p className="text-sm text-muted-foreground">
                  This user hasn&apos;t gained any followers yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            followers.map((follower) => (
              <Card
                key={follower.id}
                className="border-border/40 bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Link href={`/u/${follower.handle}`}>
                      <Avatar className="w-12 h-12 border-2 border-border hover:border-brand-primary/50 transition-colors cursor-pointer">
                        <AvatarImage
                          src={follower.image}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-magenta text-white">
                          {follower.isAnonymous ? "A" : follower.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/u/${follower.handle}`} className="block">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate hover:text-brand-primary transition-colors">
                            {follower.name}
                          </h3>
                          {follower.isAnonymous && (
                            <Badge variant="outline" className="text-xs">
                              Anonymous
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          @{follower.handle}
                        </p>
                        {follower.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {follower.bio}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{follower.stats.imageCount} images</span>
                          <span>{follower.stats.followerCount} followers</span>
                          <span>{follower.stats.followingCount} following</span>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <FollowButton
                        userId={follower.id}
                        initialIsFollowing={follower.isFollowing}
                        onFollowChange={(isFollowing) =>
                          handleFollowChange(follower.id, isFollowing)
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="text-center pt-4">
              <Button
                onClick={loadMoreFollowers}
                disabled={loadingMore}
                variant="outline"
                size="lg"
                className="hover:bg-brand-primary/10 hover:border-brand-primary/50"
              >
                {loadingMore ? "Loading..." : "Load More Followers"}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
