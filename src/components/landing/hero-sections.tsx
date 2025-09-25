"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Users, 
  Heart,
  Download,
  Share,
  Palette,
  Wand2,
  Image as ImageIcon,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description: "Advanced AI models create stunning anime-style portraits from your prompts",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Palette,
    title: "Prompt Remixing", 
    description: "Discover and remix prompts from community creations",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Community Gallery",
    description: "Share your creations and explore what others have made",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Heart,
    title: "Social Features",
    description: "Like, comment, and follow your favorite creators",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: Download,
    title: "High Quality Export",
    description: "Download your images in high resolution for any use",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Share,
    title: "Easy Sharing",
    description: "Share your masterpieces on social media with one click",
    color: "from-indigo-500 to-purple-500",
  },
];

const stats = [
  { label: "Images Generated", value: "10K+", icon: ImageIcon },
  { label: "Active Users", value: "1K+", icon: Users },
  { label: "Community Likes", value: "50K+", icon: Heart },
  { label: "Average Rating", value: "4.9", icon: Star },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function LandingHero() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-brand-magenta/5 to-brand-cyan/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--brand-primary))_0%,transparent_50%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--brand-magenta))_0%,transparent_50%)] opacity-10" />
      
      <motion.div 
        className="container relative py-20 sm:py-32 flex flex-col items-center justify-center mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto max-w-4xl text-center flex flex-col items-center">
          <motion.div variants={itemVariants}>
            <Badge 
              variant="outline" 
              className="mb-4 border-brand-primary/20 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Anime Art
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6"
            variants={itemVariants}
          >
            Create{" "}
            <span className="bg-gradient-to-r from-brand-primary via-brand-magenta to-brand-cyan bg-clip-text text-transparent">
              Stunning
            </span>{" "}
            Anime Profile Pictures
          </motion.h1>
          
          <motion.p 
            className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 sm:text-xl"
            variants={itemVariants}
          >
            Unleash your creativity with AI-generated anime avatars. 
            Generate, remix, and share beautiful profile pictures with our 
            advanced artificial intelligence.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white shadow-glow group">
              <Link href="/generate">
                <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Start Creating
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border/40 hover:bg-brand-primary/10 hover:border-brand-primary/50">
              <Link href="/explore">
                Explore Gallery
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div 
          className="mt-20 w-full max-w-4xl grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={containerVariants}
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-brand-primary" />
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container flex flex-col items-center mx-auto">
        <motion.div 
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Powerful Features for{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-magenta bg-clip-text text-transparent">
              Creative Expression
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to create, share, and discover amazing anime art
          </p>
        </motion.div>

        <motion.div 
          className="w-full max-w-6xl grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="border-border/40 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 group hover:shadow-lg">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-brand-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container flex flex-col items-center mx-auto">
        <motion.div 
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Create Your{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-magenta bg-clip-text text-transparent">
              Perfect Avatar?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of creators who are already using ppoi to bring their imagination to life
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-brand-primary to-brand-magenta hover:from-brand-primary/90 hover:to-brand-magenta/90 text-white shadow-glow group">
              <Link href="/generate">
                <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border/40 hover:bg-brand-primary/10 hover:border-brand-primary/50">
              <Link href="/explore">
                View Examples
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
