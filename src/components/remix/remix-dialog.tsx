"use client";

import { useState } from "react";
import { RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface RemixDialogProps {
  imageId: string;
  originalPrompt: string;
  originalTags?: string[];
  trigger?: React.ReactNode;
  onRemixStarted?: (jobId: string) => void;
}

const aspectRatios = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Classic (4:3)" },
  { value: "3:4", label: "Photo (3:4)" },
];

const qualityOptions = [
  { value: "fast", label: "Fast" },
  { value: "quality", label: "High Quality" },
];

export function RemixDialog({ 
  imageId, 
  originalPrompt, 
  originalTags = [], 
  trigger,
  onRemixStarted 
}: RemixDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(originalPrompt);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [quality, setQuality] = useState<"fast" | "quality">("fast");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(20);
  const [tags, setTags] = useState<string[]>([...originalTags]);
  const [newTag, setNewTag] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Prompt is required");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await api.remixImage(imageId, {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        quality,
        guidance,
        steps,
        aspectRatio,
        tags: tags.length > 0 ? tags : undefined,
        isPrivate,
      });

      toast.success("Remix started! Check the generation status.");
      setIsOpen(false);
      
      if (onRemixStarted) {
        onRemixStarted(response.jobId);
      }

      // Reset form
      setPrompt(originalPrompt);
      setNegativePrompt("");
      setTags([...originalTags]);
      
    } catch (error) {
      console.error("Remix failed:", error);
      toast.error("Failed to start remix. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Remix
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-brand-primary" />
            Remix Image
          </DialogTitle>
          <DialogDescription>
            Modify the original prompt and settings to create a variation of this image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="remix-prompt">Prompt *</Label>
            <Textarea
              id="remix-prompt"
              placeholder="Modify the original prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-20 resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {prompt.length}/1000 characters
            </div>
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label htmlFor="remix-negative">Negative Prompt (Optional)</Label>
            <Textarea
              id="remix-negative"
              placeholder="What you don't want to see..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="resize-none"
              maxLength={500}
            />
          </div>

          {/* Quality & Aspect Ratio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quality</Label>
              <Select value={quality} onValueChange={(value: "fast" | "quality") => setQuality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Advanced Settings</h4>
            
            {/* Guidance Scale */}
            <div className="space-y-2">
              <Label>Guidance Scale: {guidance}</Label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={guidance}
                onChange={(e) => setGuidance(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <Label>Steps: {steps}</Label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                className="flex-1"
              />
              <Button onClick={handleAddTag} variant="outline" size="icon">
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <Label htmlFor="remix-private">Private Generation</Label>
            <Switch
              id="remix-private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isSubmitting}
              className="flex-1 bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Remix...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create Remix
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a simple remix button component
export function RemixButton({ 
  imageId, 
  originalPrompt, 
  originalTags,
  onRemixStarted 
}: Omit<RemixDialogProps, "trigger">) {
  return (
    <RemixDialog
      imageId={imageId}
      originalPrompt={originalPrompt}
      originalTags={originalTags}
      onRemixStarted={onRemixStarted}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Remix
        </Button>
      }
    />
  );
}
