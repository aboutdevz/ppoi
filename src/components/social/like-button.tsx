"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  imageId: string;
  initialLiked?: boolean;
  initialLikeCount?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  className?: string;
  showCount?: boolean;
}

export function LikeButton({ 
  imageId, 
  initialLiked = false, 
  initialLikeCount = 0,
  size = "sm",
  variant = "ghost",
  className,
  showCount = true
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    
    try {
      const response = await api.likeImage(imageId);
      
      setIsLiked(response.isLiked);
      setLikeCount(response.likeCount);
      
      if (response.isLiked) {
        toast.success("Added to favorites!");
      } else {
        toast.success("Removed from favorites");
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast.error("Failed to update like. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const buttonSizes = {
    sm: "h-6 px-2",
    md: "h-8 px-3",
    lg: "h-10 px-4"
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        buttonSizes[size],
        "transition-all duration-200",
        isLiked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          isLiked && "fill-current"
        )} 
      />
      {showCount && (
        <span className={cn("ml-1", size === "sm" ? "text-xs" : "text-sm")}>
          {likeCount}
        </span>
      )}
    </Button>
  );
}
