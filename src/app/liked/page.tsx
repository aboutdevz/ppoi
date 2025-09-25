"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Heart, Lock, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LikedPage() {
  // Mock authentication state - in real app this would come from auth provider
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container max-w-md"
        >
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-primary to-brand-magenta rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Sign in to view your liked images and manage your favorites.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1 bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button variant="outline" className="flex-1">
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container py-8 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your{" "}
              <span className="bg-gradient-to-r from-brand-primary via-brand-magenta to-brand-cyan bg-clip-text text-transparent">
                Liked
              </span>{" "}
              Images
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All the anime art you&apos;ve fallen in love with, saved in one place.
            </p>
          </div>

          {/* Empty State */}
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No liked images yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start exploring the community to find images you love
              </p>
              <Button asChild variant="outline">
                <a href="/explore">
                  Explore Gallery
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
