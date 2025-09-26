"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Save,
  Trash2,
  Shield,
  Eye,
  Camera,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

interface UserSettings {
  id: string;
  name: string;
  handle: string;
  email?: string;
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
  updatedAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Form fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [profileVisibility, setProfileVisibility] = useState(true);

  // Validation states
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      loadUserSettings(session.user.id);
    }
  }, [status, session, router]);

  const loadUserSettings = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await api.getUserProfile(userId);
      setSettings({
        ...response,
        updatedAt: response.createdAt, // Use createdAt as fallback for updatedAt
      });

      // Populate form fields
      setName(response.name);
      setBio(response.bio || "");
      setImage(response.image || "");
    } catch (error) {
      console.error("Failed to load user settings:", error);
      toast.error("Failed to load user settings");
    } finally {
      setIsLoading(false);
    }
  };

  const validateName = (value: string): boolean => {
    if (value.trim().length < 2) {
      setNameError("Name must be at least 2 characters long");
      return false;
    }
    if (value.trim().length > 50) {
      setNameError("Name must be less than 50 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleSaveProfile = async () => {
    if (!settings || !validateName(name)) return;

    setIsSaving(true);

    try {
      await api.updateUserProfile(settings.id, {
        name: name.trim(),
        bio: bio.trim() || undefined,
        image: image.trim() || undefined,
      });

      // Update local state
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              bio: bio.trim() || undefined,
              image: image.trim() || undefined,
              updatedAt: new Date().toISOString(),
            }
          : null,
      );

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
    };
    reader.readAsDataURL(file);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-center mt-4 text-muted-foreground">
              Loading settings...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <Card className="border-border/40 bg-background/50 backdrop-blur-sm max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to access settings.
            </p>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your public profile information that others can see.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image */}
                  <div className="space-y-4">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-2 border-border">
                        <AvatarImage src={image} className="object-cover" />
                        <AvatarFallback className="text-lg">
                          {name[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div>
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button asChild variant="outline" size="sm">
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Upload Image
                            </label>
                          </Button>
                        </div>
                        {image && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImage("")}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: Square image, at least 200x200px, max 5MB
                    </p>
                  </div>

                  <Separator />

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        validateName(e.target.value);
                      }}
                      placeholder="Your display name"
                      maxLength={50}
                      className={nameError ? "border-destructive" : ""}
                    />
                    {nameError && (
                      <p className="text-xs text-destructive">{nameError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This is how others will see your name on ppoi.
                    </p>
                  </div>

                  {/* Handle (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="handle">Username</Label>
                    <Input
                      id="handle"
                      value={`@${settings.handle}`}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your username cannot be changed.
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                      rows={3}
                      maxLength={500}
                      className="resize-none"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Optional: Share a bit about yourself or your art style
                      </span>
                      <span>{bio.length}/500</span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !!nameError}
                      className="bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white"
                    >
                      {isSaving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-brand-primary" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control who can see your profile and content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Privacy settings are coming soon. For now, all profiles
                      are public.
                    </AlertDescription>
                  </Alert>

                  {/* Profile Visibility */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to find and view your profile
                      </p>
                    </div>
                    <Switch
                      checked={profileVisibility}
                      onCheckedChange={setProfileVisibility}
                      disabled
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others see when you&apos;re active
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Allow Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Let users comment on your images
                      </p>
                    </div>
                    <Switch disabled defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-primary" />
                    Account Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email (Read-only for OAuth) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={settings.email || "Not provided"}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email is managed through your OAuth provider
                      (Google/Discord).
                    </p>
                  </div>

                  <Separator />

                  {/* Account Stats */}
                  <div className="space-y-4">
                    <Label>Account Statistics</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-brand-primary">
                          {settings.stats.imageCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Images Created
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-red-500">
                          {settings.stats.likeCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Likes
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">
                          {settings.stats.followerCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Followers
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {settings.stats.followingCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Following
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Info */}
                  <div className="space-y-4">
                    <Label>Account Information</Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Account Type:
                        </span>
                        <span>
                          {settings.isAnonymous ? "Anonymous" : "Registered"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Member Since:
                        </span>
                        <span>
                          {new Date(settings.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Last Updated:
                        </span>
                        <span>
                          {new Date(settings.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <Label className="text-destructive">Danger Zone</Label>
                    <Alert className="border-destructive">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription>
                        Account deletion is not yet available. Contact support
                        if you need to delete your account.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
