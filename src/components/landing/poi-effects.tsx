"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { SakuraPetalsWithWind } from "./sakura-petals";

// Floating POI particles component
export function PoiParticles() {
  const [particles, setParticles] = React.useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      duration: number;
      delay: number;
      type: string;
    }>
  >([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    // Generate deterministic particles using seed-based randomization
    const generateParticles = () => {
      const particleTypes = ["poi", "✨", "🌟", "💫", "🎨", "🌈"];
      return Array.from({ length: 30 }, (_, i) => {
        // Use index-based seed for consistent generation
        const seed = i * 137.508; // Golden angle for good distribution
        const x = ((seed * 9301 + 49297) % 233280) / 2332.8; // 0-100
        const y = ((seed * 9307 + 49297) % 233280) / 2332.8; // 0-100
        const sizeRaw = ((seed * 9311 + 49297) % 233280) / 233280; // 0-1
        const durationRaw = ((seed * 9319 + 49297) % 233280) / 233280; // 0-1
        const delayRaw = ((seed * 9323 + 49297) % 233280) / 233280; // 0-1

        return {
          id: i,
          x: x % 100,
          y: y % 100,
          size: sizeRaw * 20 + 10,
          duration: durationRaw * 8 + 4,
          delay: delayRaw * 5,
          type: particleTypes[i % particleTypes.length],
        };
      });
    };

    setParticles(generateParticles());
  }, []);

  if (!isClient) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-brand-primary/20 font-bold select-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize:
              particle.type === "poi"
                ? `${particle.size}px`
                : `${particle.size * 1.5}px`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            scale: [0, 1, 1, 0],
            y: [0, -100, -200, -300],
            x: [
              0,
              Math.sin(particle.id) * 50,
              Math.sin(particle.id * 2) * 25,
              0,
            ],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
        >
          {particle.type}
        </motion.div>
      ))}
    </div>
  );
}

// Animated background grid
export function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="url(#gridGradient)"
              strokeWidth="1"
              opacity="0.1"
            />
          </pattern>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--brand-primary))" />
            <stop offset="50%" stopColor="hsl(var(--brand-magenta))" />
            <stop offset="100%" stopColor="hsl(var(--brand-cyan))" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating geometric shapes - using deterministic values */}
      {Array.from({ length: 15 }, (_, i) => {
        // Use deterministic values based on index
        const seed = i * 73.856;
        const leftPos = ((seed * 9001 + 49297) % 900) / 10 + 5; // 5-95%
        const topPos = ((seed * 9007 + 49297) % 900) / 10 + 5; // 5-95%
        const xMovement = ((seed * 9013 + 49297) % 300) / 10 - 15; // -15 to 15
        const duration = ((seed * 9019 + 49297) % 600) / 100 + 4; // 4-10s
        const delay = ((seed * 9029 + 49297) % 300) / 100; // 0-3s

        return (
          <motion.div
            key={i}
            className={`absolute w-4 h-4 ${
              i % 3 === 0
                ? "bg-brand-neon/20 rounded-full"
                : i % 3 === 1
                  ? "bg-brand-magenta/20"
                  : "bg-brand-cyan/20 rounded-full"
            }`}
            style={{
              left: `${leftPos}%`,
              top: `${topPos}%`,
              clipPath:
                i % 3 === 1 ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, xMovement, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}

// Pulsing orbs
export function PulsingOrbs() {
  const [orbs, setOrbs] = React.useState<
    Array<{
      id: number;
      size: number;
      x: number;
      y: number;
      color: string;
      duration: number;
    }>
  >([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    // Generate deterministic orbs
    const generateOrbs = () => {
      const colors = [
        "brand-primary",
        "brand-magenta",
        "brand-cyan",
        "brand-neon",
      ];
      return Array.from({ length: 8 }, (_, i) => {
        const seed = i * 157.079; // Different seed again
        const sizeRaw = ((seed * 8009 + 49297) % 233280) / 233280;
        const xRaw = ((seed * 8011 + 49297) % 233280) / 233280;
        const yRaw = ((seed * 8017 + 49297) % 233280) / 233280;
        const durationRaw = ((seed * 8021 + 49297) % 233280) / 233280;

        return {
          id: i,
          size: sizeRaw * 200 + 100,
          x: xRaw * 80 + 10,
          y: yRaw * 80 + 10,
          color: colors[i % 4],
          duration: durationRaw * 4 + 2,
        };
      });
    };

    setOrbs(generateOrbs());
  }, []);

  if (!isClient) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute rounded-full bg-gradient-to-br from-${orb.color}/10 to-${orb.color}/5 blur-3xl`}
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Main effects component that combines all effects
export function PoiEffects() {
  return (
    <>
      <SakuraPetalsWithWind />
      <PoiParticles />
      <AnimatedGrid />
      <PulsingOrbs />
    </>
  );
}
