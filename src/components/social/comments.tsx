"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, MoreVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    handle: string;
    image?: string;
  };
}

interface CommentsProps {
  imageId: string;
  initialCommentCount?: number;
  trigger?: React.ReactNode;
}

export function Comments({
  imageId,
  initialCommentCount = 0,
  trigger,
}: CommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Load comments when dialog opens
  const loadComments = useCallback(
    async (pageNum: number = 1, replace: boolean = false) => {
      try {
        setIsLoading(true);
        const response = await api.getImageComments(imageId, pageNum, 20);

        if (replace) {
          setComments(response.data);
        } else {
          setComments((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    },
    [imageId],
  );

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments(1, true);
    }
  }, [isOpen, comments.length, loadComments]);

  // Load comments when dialog opens
  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments(1, true);
    }
  }, [isOpen, comments.length, loadComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await api.commentOnImage(imageId, newComment.trim());

      // Add new comment to the top of the list
      setComments((prev) => [response.comment, ...prev]);
      setCommentCount((prev) => prev + 1);
      setNewComment("");
      toast.success("Comment added!");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{commentCount}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({commentCount})
          </DialogTitle>
          <DialogDescription>
            Share your thoughts about this artwork
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Comment form */}
          <form
            onSubmit={handleSubmitComment}
            className="space-y-3 pb-4 border-b"
          >
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500 characters
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
                className="bg-brand-primary hover:bg-brand-primary/90"
              >
                {isSubmitting ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {comments.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs">Be the first to share your thoughts!</p>
              </div>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.image} />
                  <AvatarFallback className="text-xs">
                    {comment.user.name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{comment.user.handle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive">
                      Report comment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load more button */}
            {hasMore && comments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadComments(page + 1, false)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Loading..." : "Load more comments"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple comment button component
export function CommentButton({
  imageId,
  commentCount = 0,
}: {
  imageId: string;
  commentCount?: number;
}) {
  return (
    <Comments
      imageId={imageId}
      initialCommentCount={commentCount}
      trigger={
        <Button variant="ghost" size="sm" className="h-6 px-2">
          <MessageCircle className="h-3 w-3" />
          <span className="ml-1 text-xs">{commentCount}</span>
        </Button>
      }
    />
  );
}
