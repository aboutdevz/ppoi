"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Wand2, 
  Sparkles, 
  Download, 
  Share2, 
  Heart,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Tag,
  Lock,
  Unlock,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

// Mock data for demonstration
const popularPrompts = [
  "anime girl with purple hair and golden eyes",
  "cute cat girl with pink bow and school uniform",
  "mysterious dark-haired anime boy with blue flames",
  "kawaii magical girl with rainbow staff",
  "cool anime warrior with silver armor",
];

const aspectRatios = [
  { value: "1:1", label: "Square (1:1)", description: "Perfect for profile pictures" },
  { value: "16:9", label: "Landscape (16:9)", description: "Wide format" },
  { value: "9:16", label: "Portrait (9:16)", description: "Tall format" },
  { value: "4:3", label: "Classic (4:3)", description: "Traditional ratio" },
  { value: "3:4", label: "Photo (3:4)", description: "Portrait photo" },
];

const qualityOptions = [
  { value: "fast", label: "Fast", description: "Quick generation, good quality", icon: Zap },
  { value: "quality", label: "High Quality", description: "Slower but better results", icon: Sparkles },
];

type GenerationStatus = "idle" | "generating" | "completed" | "error";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  settings: {
    quality: string;
    aspectRatio: string;
    guidance: number;
    steps: number;
  };
  createdAt: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [quality, setQuality] = useState("fast");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(20);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isGenerating = status === "generating";
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setStatus("generating");
    
    try {
      // Start generation
      const generateResponse = await api.generateImage({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        quality: quality as "fast" | "quality",
        guidance,
        steps,
        aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
        tags: tags.length > 0 ? tags : undefined,
        isPrivate,
      });

      const jobId = generateResponse.jobId;
      setCurrentJobId(jobId);
      toast.success("Generation started! This may take a moment...");

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.getGenerationStatus(jobId);
          
          if (statusResponse.status === "completed" && statusResponse.image) {
            clearInterval(pollInterval);
            
            const generatedImg: GeneratedImage = {
              id: statusResponse.image.id,
              url: statusResponse.image.url,
              prompt: statusResponse.image.prompt,
              settings: {
                quality,
                aspectRatio: statusResponse.image.aspectRatio,
                guidance,
                steps,
              },
              createdAt: new Date().toISOString(),
            };
            
            setGeneratedImage(generatedImg);
            setStatus("completed");
            toast.success("Image generated successfully!");
            
          } else if (statusResponse.status === "failed") {
            clearInterval(pollInterval);
            setStatus("error");
            toast.error(statusResponse.error || "Generation failed. Please try again.");
          }
        } catch {
          clearInterval(pollInterval);
          setStatus("error");
          toast.error("Failed to check generation status.");
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup interval after 5 minutes to prevent indefinite polling
      setTimeout(() => {
        clearInterval(pollInterval);
        // Check current status state instead of the stale closure value
        setStatus(currentStatus => {
          if (currentStatus === "generating") {
            toast.error("Generation timed out. Please try again.");
            return "error";
          }
          return currentStatus;
        });
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Generation failed:", error);
      setStatus("error");
      if (error instanceof Error) {
        toast.error(error.message || "Failed to generate image. Please try again.");
      } else {
        toast.error("Failed to generate image. Please try again.");
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUsePrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleCopyPrompt = async () => {
    if (generatedImage) {
      await navigator.clipboard.writeText(generatedImage.prompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      // Mock download - in real implementation this would download the actual image
      toast.success("Image downloaded!");
    }
  };

  const handleShare = () => {
    if (generatedImage) {
      // Mock share - in real implementation this would share the image
      toast.success("Share link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Create Your{" "}
              <span className="bg-gradient-to-r from-brand-primary via-brand-magenta to-brand-cyan bg-clip-text text-transparent">
                AI Anime
              </span>{" "}
              Profile Picture
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Describe your perfect anime character and watch AI bring it to life. 
              Generate, customize, and share stunning profile pictures.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Generation Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-brand-primary" />
                    Generation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prompt Input */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Describe your character *</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., anime girl with purple hair and golden eyes, wearing a school uniform, smiling..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-20 resize-none"
                      maxLength={1000}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {prompt.length}/1000 characters
                    </div>
                  </div>

                  {/* Popular Prompts */}
                  <div className="space-y-2">
                    <Label>Popular Prompts</Label>
                    <div className="flex flex-wrap gap-2">
                      {popularPrompts.map((popularPrompt) => (
                        <Button
                          key={popularPrompt}
                          variant="outline"
                          size="sm"
                          onClick={() => handleUsePrompt(popularPrompt)}
                          className="text-xs hover:bg-brand-primary/10 hover:border-brand-primary/50"
                        >
                          {popularPrompt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Settings */}
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      {/* Quality */}
                      <div className="space-y-2">
                        <Label>Quality</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {qualityOptions.map((option) => (
                            <Button
                              key={option.value}
                              variant={quality === option.value ? "default" : "outline"}
                              onClick={() => setQuality(option.value)}
                              className={`p-4 h-auto flex flex-col items-start ${
                                quality === option.value 
                                  ? "bg-brand-primary text-white" 
                                  : "hover:bg-brand-primary/10 hover:border-brand-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <option.icon className="h-4 w-4" />
                                <span className="font-medium">{option.label}</span>
                              </div>
                              <span className="text-xs opacity-70">{option.description}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Aspect Ratio */}
                      <div className="space-y-2">
                        <Label>Aspect Ratio</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {aspectRatios.map((ratio) => (
                              <SelectItem key={ratio.value} value={ratio.value}>
                                <div>
                                  <div className="font-medium">{ratio.label}</div>
                                  <div className="text-xs text-muted-foreground">{ratio.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4">
                      {/* Negative Prompt */}
                      <div className="space-y-2">
                        <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                        <Textarea
                          id="negative-prompt"
                          placeholder="What you don't want to see (e.g., blurry, low quality, distorted)"
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          className="resize-none"
                          maxLength={500}
                        />
                      </div>

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
                        <div className="text-xs text-muted-foreground">
                          Higher values follow prompt more closely
                        </div>
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
                        <div className="text-xs text-muted-foreground">
                          More steps = better quality, longer generation time
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

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
                        <Tag className="h-4 w-4" />
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
                    <div className="flex items-center gap-2">
                      {isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      <Label htmlFor="private">Private Generation</Label>
                    </div>
                    <Switch
                      id="private"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white shadow-glow"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Result Area */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Generation Status */}
              {(isGenerating || status === "completed" || status === "error") && (
                <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    {isGenerating && (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-primary to-brand-magenta rounded-full flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-white animate-spin" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Creating your anime character...</h3>
                          <p className="text-sm text-muted-foreground">
                            This usually takes 30-60 seconds
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-gradient-to-r from-brand-primary to-brand-magenta h-2 rounded-full animate-pulse w-1/2"></div>
                        </div>
                      </div>
                    )}

                    {status === "error" && (
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto bg-destructive rounded-full flex items-center justify-center">
                          <Wand2 className="w-8 h-8 text-destructive-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 text-destructive">Generation Failed</h3>
                          <p className="text-sm text-muted-foreground">
                            Something went wrong. Please try again with a different prompt.
                          </p>
                        </div>
                        <Button onClick={handleGenerate} variant="outline">
                          Try Again
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Generated Image */}
              {generatedImage && status === "completed" && (
                <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-4">
                    {/* Image */}
                    <div className="relative group">
                      <div className="w-full aspect-square relative rounded-lg overflow-hidden shadow-lg">
                        <Image
                          src={generatedImage.url}
                          alt="Generated anime character"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button onClick={handleDownload} variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button onClick={handleShare} variant="outline" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Prompt Used</Label>
                        <Button
                          onClick={handleCopyPrompt}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {generatedImage.prompt}
                      </p>
                    </div>

                    {/* Settings Used */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quality:</span>{" "}
                        <span className="font-medium capitalize">{generatedImage.settings.quality}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ratio:</span>{" "}
                        <span className="font-medium">{generatedImage.settings.aspectRatio}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Guidance:</span>{" "}
                        <span className="font-medium">{generatedImage.settings.guidance}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Steps:</span>{" "}
                        <span className="font-medium">{generatedImage.settings.steps}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Placeholder when idle */}
              {status === "idle" && (
                <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Your generated image will appear here</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill out the form and click generate to create your anime character
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
