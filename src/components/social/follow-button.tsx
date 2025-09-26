"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowerCount?: number;
  onFollowChange?: (isFollowing: boolean, followerCount: number) => void;
  size?: "sm" | "lg" | "default";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export function FollowButton({
  userId,
  initialIsFollowing = false,
  initialFollowerCount = 0,
  onFollowChange,
  size = "sm",
  variant = "outline",
  className,
  showIcon = true,
  showText = true,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [, setFollowerCount] = useState(initialFollowerCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!session?.user) {
      toast.error("Please sign in to follow users");
      router.push("/auth/signin");
      return;
    }

    // Check if user is trying to follow themselves
    if (session.user.id === userId) {
      toast.error("You cannot follow yourself");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      // Set user token for API calls
      api.setUserToken(session.user.id!);

      const response = await api.toggleFollow(userId);

      setIsFollowing(response.isFollowing);
      setFollowerCount(response.followerCount);

      // Call callback if provided
      if (onFollowChange) {
        onFollowChange(response.isFollowing, response.followerCount);
      }

      toast.success(
        response.isFollowing
          ? "Successfully followed user!"
          : "Successfully unfollowed user",
      );
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      toast.error("Failed to update follow status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (session?.user?.id === userId) {
    return null;
  }

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  } as const;

  const buttonVariant = isFollowing
    ? variant === "default"
      ? "outline"
      : variant
    : variant;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isFollowing &&
          "border-brand-primary text-brand-primary bg-brand-primary/5",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizes[size], showText ? "mr-2" : "")} />
      ) : (
        showIcon &&
        (isFollowing ? (
          <UserMinus className={cn(iconSizes[size], showText ? "mr-2" : "")} />
        ) : (
          <UserPlus className={cn(iconSizes[size], showText ? "mr-2" : "")} />
        ))
      )}
      {showText &&
        (isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow")}
    </Button>
  );
}
