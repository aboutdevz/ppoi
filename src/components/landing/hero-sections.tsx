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
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description:
      "Advanced AI models create stunning anime-style portraits from your prompts",
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

// Animated Poi Text Component
function AnimatedPoiText() {
  const [isClient, setIsClient] = React.useState(false);
  const [poiElements, setPoiElements] = React.useState<
    Array<{
      text: string;
      left: number;
      top: number;
      rotation: number;
      size: string;
    }>
  >([]);

  React.useEffect(() => {
    setIsClient(true);

    const poiVariations = [
      "poi~~",
      "poi poi poi poiii",
      "poi poi poi poiii",
      "poiiii poiiiiii",
      "poi poi poi poiii",
      "poi poi poi poiii",
      "poi poi poi poiii",
      "poiiii poiiiiii",
      "poi poi poi poiii",
      "poi poi poi poiii",
      "poi poi poi poiii",
      "poiiii poiiiiii",
      "poi poi poi poiii",
    ];

    // Generate deterministic positions for poi text
    const elements = poiVariations.map((poi, index) => {
      const seed = index * 47.123; // Unique seed for text positioning
      const leftPos = ((seed * 7001 + 49297) % 8000) / 100 + 10; // 10-90%
      const topPos = ((seed * 7007 + 49297) % 8000) / 100 + 10; // 10-90%
      const rotation = ((seed * 7013 + 49297) % 4000) / 100 - 20; // -20 to 20 degrees

      return {
        text: poi,
        left: leftPos,
        top: topPos,
        rotation: rotation,
        size:
          index % 3 === 0
            ? "text-xs"
            : index % 3 === 1
              ? "text-sm"
              : "text-base",
      };
    });

    setPoiElements(elements);
  }, []);

  if (!isClient) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" />
    );
  }

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 2 }}
    >
      {poiElements.map((element, index) => (
        <motion.span
          key={index}
          className={`absolute text-brand-primary/30 font-bold select-none ${element.size}`}
          style={{
            left: `${element.left}%`,
            top: `${element.top}%`,
            transform: `rotate(${element.rotation}deg)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            y: [0, -20, -40, -60],
          }}
          transition={{
            duration: 4,
            delay: index * 0.3,
            repeat: Infinity,
            repeatDelay: 8,
          }}
        >
          {element.text}
        </motion.span>
      ))}
    </motion.div>
  );
}

// Floating Graphics Component
function FloatingGraphics() {
  const [shapes, setShapes] = React.useState<
    Array<{
      id: number;
      type: string;
      size: number;
      x: number;
      y: number;
      duration: number;
      delay: number;
      xMovement: number;
    }>
  >([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    // Generate deterministic shapes
    const generateShapes = () => {
      const shapeTypes = ["dot", "line", "triangle", "star"];
      return Array.from({ length: 20 }, (_, i) => {
        const seed = i * 73.856; // Different seed from particles
        const typeIndex = Math.floor(((seed * 9001 + 49297) % 233280) / 58320);
        const sizeRaw = ((seed * 9007 + 49297) % 233280) / 233280;
        const xRaw = ((seed * 9013 + 49297) % 233280) / 2332.8;
        const yRaw = ((seed * 9019 + 49297) % 233280) / 2332.8;
        const durationRaw = ((seed * 9029 + 49297) % 233280) / 233280;
        const delayRaw = ((seed * 9041 + 49297) % 233280) / 233280;
        const xMovementRaw = ((seed * 9043 + 49297) % 233280) / 233280;

        return {
          id: i,
          type: shapeTypes[typeIndex % 4],
          size: sizeRaw * 30 + 10,
          x: xRaw % 100,
          y: yRaw % 100,
          duration: durationRaw * 10 + 5,
          delay: delayRaw * 5,
          xMovement: (xMovementRaw - 0.5) * 50,
        };
      });
    };

    setShapes(generateShapes());
  }, []);

  if (!isClient) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className={`absolute ${
            shape.type === "dot"
              ? "rounded-full bg-gradient-to-r from-brand-neon to-brand-cyan"
              : shape.type === "line"
                ? "bg-gradient-to-r from-brand-magenta to-brand-primary"
                : shape.type === "triangle"
                  ? "bg-gradient-to-br from-brand-primary to-brand-neon"
                  : "bg-gradient-to-tr from-brand-cyan to-brand-magenta"
          } opacity-20`}
          style={{
            width: shape.size,
            height: shape.type === "line" ? 2 : shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            clipPath:
              shape.type === "triangle"
                ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                : shape.type === "star"
                  ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                  : "none",
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, shape.xMovement, 0],
            rotate: shape.type !== "line" ? [0, 360] : [0, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function LandingHero() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-primary/10 via-background to-brand-magenta/10">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--brand-neon))_0%,transparent_40%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--brand-magenta))_0%,transparent_40%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,hsl(var(--brand-cyan))_0%,transparent_40%)] opacity-20" />
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,hsl(var(--brand-primary))_60deg,transparent_120deg)] opacity-10" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Floating Graphics */}
      <FloatingGraphics />

      {/* Animated Poi Text */}
      <AnimatedPoiText />

      <motion.div
        className="container relative py-20 sm:py-32 flex flex-col items-center justify-center mx-auto min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mx-auto max-w-6xl text-center flex flex-col items-center">
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="mb-6 border-brand-neon/30 bg-brand-neon/10 text-brand-neon hover:bg-brand-neon/20 shadow-lg shadow-brand-neon/20 animate-pulse"
            >
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />✨ POI POI
              REVOLUTION ✨
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.div className="relative mb-6" variants={itemVariants}>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl mb-2 leading-none">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-neon via-brand-magenta to-brand-cyan animate-pulse">
                MAKE YOUR OWN
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-cyan to-brand-neon">
                IMAGE POI~~
              </span>
            </h1>

            {/* Decorative Elements */}
            <motion.div
              className="absolute -top-4 -right-4 text-6xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌟
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-6 text-4xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.div>
          </motion.div>

          {/* Big Motivational Text */}
          <motion.div className="mb-8 relative" variants={itemVariants}>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-magenta to-brand-cyan">
              LETS MAKE SOME POI — POI IMAGE EVERYWHERE!
            </h2>
          </motion.div>

          <motion.p
            className="mx-auto max-w-3xl text-lg text-muted-foreground mb-10 sm:text-xl leading-relaxed"
            variants={itemVariants}
          >
            🌈 Dive into the ultimate anime avatar creation experience! Generate
            stunning, one-of-a-kind profile pictures with our next-generation
            AI. Join the POI revolution and bring your anime dreams to life!
            🚀✨
          </motion.p>

          {/* Enhanced CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
            variants={itemVariants}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-brand-neon via-brand-magenta to-brand-cyan hover:from-brand-neon/90 hover:via-brand-magenta/90 hover:to-brand-cyan/90 text-white shadow-2xl shadow-brand-magenta/50 group transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-full"
            >
              <Link href="/generate">
                <Zap className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                START CREATING POI!
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-brand-cyan/50 hover:bg-brand-cyan/10 hover:border-brand-cyan text-brand-cyan hover:text-brand-cyan transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-full backdrop-blur-sm"
            >
              <Link href="/explore">
                <ImageIcon className="w-5 h-5 mr-3" />
                EXPLORE GALLERY
              </Link>
            </Button>
          </motion.div>

          {/* Fun Stats Grid */}
          <motion.div
            className="w-full max-w-5xl grid grid-cols-2 gap-4 sm:grid-cols-4"
            variants={containerVariants}
          >
            {stats.map((stat, index) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="border-2 border-brand-primary/20 bg-gradient-to-br from-background/80 to-brand-primary/5 backdrop-blur-lg hover:bg-gradient-to-br hover:from-background/90 hover:to-brand-primary/10 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-brand-primary/20">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${
                        index % 4 === 0
                          ? "from-brand-neon to-brand-cyan"
                          : index % 4 === 1
                            ? "from-brand-magenta to-brand-primary"
                            : index % 4 === 2
                              ? "from-brand-cyan to-brand-neon"
                              : "from-brand-primary to-brand-magenta"
                      } flex items-center justify-center animate-pulse`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-black mb-2 bg-gradient-to-r from-brand-primary to-brand-magenta bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden bg-gradient-to-br from-brand-cyan/5 via-background to-brand-neon/5">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,hsl(var(--brand-neon))_0%,transparent_50%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,hsl(var(--brand-magenta))_0%,transparent_50%)] opacity-10" />

      <div className="container flex flex-col items-center mx-auto relative">
        <motion.div
          className="mx-auto max-w-4xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 bg-gradient-to-r from-brand-magenta/20 to-brand-cyan/20 text-brand-primary border-brand-primary/30 text-lg px-6 py-2">
            🎆 SUPER FEATURES 🎆
          </Badge>
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl mb-6 leading-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-neon to-brand-magenta">
              POWERFUL FEATURES FOR
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-cyan">
              CREATIVE POI MAGIC! ✨
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            🌈 Everything you need to create, share, and discover amazing anime
            art in the POI universe! 🚀
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-7xl grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="border-2 border-brand-primary/20 bg-gradient-to-br from-background/90 to-brand-primary/5 backdrop-blur-lg hover:bg-gradient-to-br hover:from-background/95 hover:to-brand-primary/10 transition-all duration-500 group hover:shadow-2xl hover:shadow-brand-primary/20 transform hover:scale-105 hover:-translate-y-2 h-full">
                <CardContent className="p-8 h-full flex flex-col">
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <motion.div
                      className="absolute -top-2 -right-2 text-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    >
                      ✨
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-black mb-4 group-hover:text-brand-primary transition-colors uppercase tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground flex-grow leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-brand-primary font-semibold text-sm uppercase tracking-wider">
                      POI POWER!
                    </span>
                    <motion.div
                      className="text-brand-magenta"
                      whileHover={{ scale: 1.2, rotate: 180 }}
                    >
                      →
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Extra Call-to-Action */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-brand-neon/10 via-brand-magenta/10 to-brand-cyan/10 rounded-3xl p-8 border-2 border-brand-primary/20 backdrop-blur-sm">
            <h3 className="text-2xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-magenta">
              🎉 READY TO JOIN THE POI REVOLUTION? 🎉
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Thousands of creators are already making amazing art with POI!
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-brand-magenta to-brand-cyan hover:from-brand-magenta/90 hover:to-brand-cyan/90 text-white shadow-xl shadow-brand-magenta/30 transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-full"
            >
              <Link href="/generate">
                <Star className="w-5 h-5 mr-3 animate-pulse" />
                START YOUR POI JOURNEY!
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingShowcase() {
  const exampleImages = [
    {
      id: "example-1",
      prompt:
        "anime girl with purple hair and golden eyes, mystical forest background poi~~",
      url: "/api/placeholder/400/400",
      aspectRatio: "1:1",
      tags: ["anime", "purple hair", "golden eyes", "mystical", "poi"],
      emoji: "🧚‍♀️",
    },
    {
      id: "example-2",
      prompt:
        "cyberpunk anime warrior with neon armor and glowing sword poi poi poi!",
      url: "/api/placeholder/400/400",
      aspectRatio: "1:1",
      tags: ["cyberpunk", "warrior", "neon", "glowing", "poi"],
      emoji: "⚔️",
    },
    {
      id: "example-3",
      prompt:
        "cute anime girl with cat ears with pink bow and school uniform poiii~",
      url: "/api/placeholder/400/400",
      aspectRatio: "1:1",
      tags: [
        "cat girl",
        "pink bow",
        "school uniform",
        "cherry blossoms",
        "poi",
      ],
      emoji: "🐱",
    },
    {
      id: "example-4",
      prompt: "magical girl with rainbow staff and sparkling dress poiiiiii!",
      url: "/api/placeholder/400/400",
      aspectRatio: "1:1",
      tags: ["magical girl", "rainbow", "sparkles", "dress", "poi"],
      emoji: "🌈",
    },
  ];

  return (
    <section className="py-20 sm:py-32 relative overflow-hidden bg-gradient-to-br from-brand-primary/5 via-background to-brand-cyan/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-brand-neon/20 to-brand-magenta/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-brand-cyan/20 to-brand-primary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-brand-magenta/15 to-brand-neon/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container flex flex-col items-center mx-auto relative">
        <motion.div
          className="mx-auto max-w-4xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 bg-gradient-to-r from-brand-cyan/20 to-brand-neon/20 text-brand-primary border-brand-primary/30 text-lg px-6 py-2">
            🎨 POI GALLERY 🎨
          </Badge>
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl mb-6 leading-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-neon to-brand-cyan">
              SEE WHAT&apos;S POSSIBLE
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-magenta to-brand-primary">
              WITH POI MAGIC! ✨
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            🎆 From simple prompts to stunning anime art - check out these
            amazing POI creations! 🚀
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-7xl grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {exampleImages.map((image, index) => (
            <motion.div key={image.id} variants={itemVariants}>
              <Card className="border-2 border-brand-primary/20 bg-gradient-to-br from-background/90 to-brand-primary/5 backdrop-blur-lg hover:bg-gradient-to-br hover:from-background/95 hover:to-brand-primary/10 transition-all duration-500 group overflow-hidden hover:shadow-2xl hover:shadow-brand-primary/20 transform hover:scale-105 hover:-translate-y-2">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {/* Enhanced gradient placeholder */}
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        index % 4 === 0
                          ? "from-brand-neon/60 via-brand-magenta/40 to-brand-primary/60"
                          : index % 4 === 1
                            ? "from-brand-cyan/60 via-brand-neon/40 to-brand-magenta/60"
                            : index % 4 === 2
                              ? "from-brand-primary/60 via-brand-cyan/40 to-brand-neon/60"
                              : "from-brand-magenta/60 via-brand-primary/40 to-brand-cyan/60"
                      } group-hover:opacity-80 transition-opacity duration-300`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                        {image.emoji}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 text-2xl animate-bounce">
                      ✨
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-sm font-bold">POI!</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed group-hover:text-foreground transition-colors">
                      {image.prompt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {image.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          className={`text-xs bg-gradient-to-r ${
                            tag === "poi"
                              ? "from-brand-neon/20 to-brand-magenta/20 text-brand-primary border-brand-primary/30"
                              : "from-brand-primary/10 to-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
                          }`}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-brand-primary font-semibold text-sm uppercase tracking-wider">
                        🌟 AMAZING!
                      </span>
                      <motion.div
                        className="text-brand-magenta text-xl"
                        whileHover={{ scale: 1.2, rotate: 15 }}
                      >
                        💖
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-brand-neon/10 via-brand-magenta/10 to-brand-cyan/10 rounded-3xl p-8 border-2 border-brand-primary/20 backdrop-blur-sm">
            <h3 className="text-2xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-magenta">
              🎆 WANT TO SEE MORE POI MAGIC? 🎆
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Explore thousands of amazing creations in our gallery!
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-brand-cyan to-brand-neon hover:from-brand-cyan/90 hover:to-brand-neon/90 text-white shadow-xl shadow-brand-cyan/30 transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-full"
            >
              <Link href="/explore">
                <ImageIcon className="w-5 h-5 mr-3 animate-pulse" />
                EXPLORE POI GALLERY!
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingCTA() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden bg-gradient-to-br from-brand-magenta/10 via-background to-brand-neon/10">
      {/* Epic Background Effects */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,hsl(var(--brand-neon))_40deg,transparent_80deg,hsl(var(--brand-magenta))_120deg,transparent_160deg,hsl(var(--brand-cyan))_200deg,transparent_240deg,hsl(var(--brand-primary))_280deg,transparent_320deg)] opacity-5 animate-spin"
          style={{ animationDuration: "20s" }}
        />
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-brand-neon/20 to-brand-magenta/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-brand-cyan/20 to-brand-primary/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-brand-magenta/15 to-brand-neon/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container flex flex-col items-center mx-auto relative">
        <motion.div
          className="mx-auto max-w-5xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Big Final Message */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-brand-neon/30 to-brand-magenta/30 text-brand-primary border-brand-primary/40 text-xl px-8 py-3 animate-pulse">
              🎉 FINAL CALL FOR POI ADVENTURE! 🎉
            </Badge>
          </motion.div>

          <h2 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl mb-8 leading-none">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-neon via-brand-magenta to-brand-cyan animate-pulse">
              READY TO CREATE
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-cyan to-brand-neon">
              YOUR PERFECT POI?
            </span>
            <div className="flex justify-center items-center gap-4 mt-4">
              <motion.span
                className="text-6xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎆
              </motion.span>
              <motion.span
                className="text-6xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <motion.span
                className="text-6xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                🌈
              </motion.span>
            </div>
          </h2>

          <motion.p
            className="mx-auto max-w-4xl text-xl text-muted-foreground mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            🚀 Join{" "}
            <span className="font-black text-brand-primary">
              thousands of creators
            </span>{" "}
            who are already using POI to bring their anime imagination to life!
            Don&apos;t miss out on the{" "}
            <span className="font-black text-brand-magenta">
              POI revolution!
            </span>{" "}
            🎯✨
          </motion.p>

          {/* Epic CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-brand-neon via-brand-magenta to-brand-cyan hover:from-brand-neon/90 hover:via-brand-magenta/90 hover:to-brand-cyan/90 text-white shadow-2xl shadow-brand-magenta/50 group transform hover:scale-110 transition-all duration-300 text-xl px-12 py-6 rounded-full animate-pulse"
            >
              <Link href="/generate">
                <Sparkles className="w-6 h-6 mr-4 group-hover:animate-spin" />
                GET STARTED FREE - POI NOW!
                <ArrowRight className="w-6 h-6 ml-4 group-hover:translate-x-3 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-3 border-brand-cyan/60 hover:bg-brand-cyan/20 hover:border-brand-cyan text-brand-cyan hover:text-brand-cyan transform hover:scale-110 transition-all duration-300 text-xl px-12 py-6 rounded-full backdrop-blur-sm"
            >
              <Link href="/explore">
                <ImageIcon className="w-6 h-6 mr-4" />
                VIEW POI EXAMPLES
              </Link>
            </Button>
          </motion.div>

          {/* Final Motivational Section */}
          <motion.div
            className="bg-gradient-to-r from-brand-neon/10 via-brand-magenta/10 to-brand-cyan/10 rounded-3xl p-12 border-3 border-brand-primary/30 backdrop-blur-sm shadow-2xl shadow-brand-primary/20"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid gap-6 md:grid-cols-3 text-center">
              <div>
                <div className="text-4xl mb-4">🎆</div>
                <h4 className="text-lg font-black text-brand-neon mb-2">
                  FREE TO START!
                </h4>
                <p className="text-sm text-muted-foreground">
                  No credit card required
                </p>
              </div>
              <div>
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="text-lg font-black text-brand-magenta mb-2">
                  INSTANT RESULTS!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Generate in seconds
                </p>
              </div>
              <div>
                <div className="text-4xl mb-4">🌈</div>
                <h4 className="text-lg font-black text-brand-cyan mb-2">
                  UNLIMITED POI!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Create as many as you want
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
