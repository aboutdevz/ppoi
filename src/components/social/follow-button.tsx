"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  size?: "sm" | "lg" | "default";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  showIcon?: boolean;
}

export function FollowButton({ 
  userId, 
  initialFollowing = false,
  size = "sm",
  variant = "outline",
  className,
  showIcon = true
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      const response = await api.followUser(userId);
      
      setIsFollowing(response.isFollowing);
      
      if (response.isFollowing) {
        toast.success("Following user!");
      } else {
        toast.success("Unfollowed user");
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      toast.error("Failed to update follow status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4", 
    lg: "h-5 w-5"
  } as const;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isFollowing && variant === "outline" && "border-brand-primary text-brand-primary",
        className
      )}
    >
      {showIcon && (
        isFollowing ? (
          <UserCheck className={cn(iconSizes[size], "mr-1")} />
        ) : (
          <UserPlus className={cn(iconSizes[size], "mr-1")} />
        )
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
