"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface Petal {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
  color: string;
  opacity: number;
}

export function SakuraPetals() {
  const [petals, setPetals] = React.useState<Petal[]>([]);

  React.useEffect(() => {
    // Create initial petals
    const initialPetals = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Start position across screen width
      y: -10, // Start above screen
      size: Math.random() * 8 + 4, // Size between 4-12px
      rotation: Math.random() * 360,
      duration: Math.random() * 8 + 6, // Fall duration 6-14s
      delay: Math.random() * 10, // Stagger the start
      color: ["#FFB7C5", "#FFC0CB", "#FFCCCB", "#F8BBD9", "#FFE4E6"][
        Math.floor(Math.random() * 5)
      ], // Pink variations
      opacity: Math.random() * 0.8 + 0.3, // 0.3-1.1 opacity
    }));

    setPetals(initialPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute"
          style={{
            left: `${petal.x}%`,
            width: petal.size,
            height: petal.size,
          }}
          initial={{
            y: -20,
            rotate: petal.rotation,
            opacity: 0,
          }}
          animate={{
            y: [
              -20,
              window.innerHeight * 0.3,
              window.innerHeight * 0.6,
              window.innerHeight + 50,
            ],
            x: [
              0,
              Math.sin(petal.id * 0.1) * 100,
              Math.sin(petal.id * 0.2) * -50,
              Math.sin(petal.id * 0.3) * 30,
            ],
            rotate: [
              petal.rotation,
              petal.rotation + 180,
              petal.rotation + 360,
              petal.rotation + 540,
            ],
            opacity: [0, petal.opacity, petal.opacity, 0],
            scale: [0.8, 1, 1.1, 0.6],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1],
          }}
        >
          {/* SVG Sakura Petal */}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <path
              d="M10 2C12 2 14 4 14 7C14 8 13.5 9 13 9.5C15 10 18 12 18 15C18 17 16 18 14 17.5C13.5 17.3 13 16.8 12.5 16C12.8 17.5 12 20 10 20C8 20 7.2 17.5 7.5 16C7 16.8 6.5 17.3 6 17.5C4 18 2 17 2 15C2 12 5 10 7 9.5C6.5 9 6 8 6 7C6 4 8 2 10 2Z"
              fill={petal.color}
              fillOpacity="0.9"
            />
            {/* Inner highlight */}
            <path
              d="M10 3C11.5 3 12.5 4.5 12.5 6.5C12.5 7.2 12.2 7.8 11.8 8.2C13.2 8.6 15.5 10.2 15.5 12.5C15.5 14 14.5 14.5 13.5 14.2C13.2 14.1 12.8 13.8 12.4 13.2C12.6 14.2 12.2 16 10 16C7.8 16 7.4 14.2 7.6 13.2C7.2 13.8 6.8 14.1 6.5 14.2C5.5 14.5 4.5 14 4.5 12.5C4.5 10.2 6.8 8.6 8.2 8.2C7.8 7.8 7.5 7.2 7.5 6.5C7.5 4.5 8.5 3 10 3Z"
              fill="white"
              fillOpacity="0.3"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// Enhanced sakura petals with wind effect
export function SakuraPetalsWithWind() {
  const [petals, setPetals] = React.useState<Petal[]>([]);
  const [windDirection, setWindDirection] = React.useState(1);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);

    // Change wind direction occasionally
    const windInterval = setInterval(() => {
      setWindDirection((prev) => prev * -1 + (Math.random() - 0.5) * 0.5);
    }, 8000);

    // Create petals in batches for continuous falling
    const createPetalBatch = () => {
      const batchSize = 8;
      const newPetals = Array.from({ length: batchSize }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 110 - 5, // Start slightly off-screen
        y: -20,
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 360,
        duration: Math.random() * 10 + 8, // Longer fall time
        delay: Math.random() * 2,
        color: [
          "#FFB7C5", // Light pink
          "#FFC0CB", // Pink
          "#FFCCCB", // Light coral
          "#F8BBD9", // Lavender pink
          "#FFE4E6", // Very light pink
          "#FF91A4", // Rose pink
          "#FFABC9", // Soft pink
        ][Math.floor(Math.random() * 7)],
        opacity: Math.random() * 0.7 + 0.4,
      }));

      setPetals((prev) => [...prev.slice(-42), ...newPetals]); // Keep max 50 petals
    };

    // Initial batch
    createPetalBatch();

    // Create new batches periodically
    const petalInterval = setInterval(createPetalBatch, 3000);

    return () => {
      clearInterval(windInterval);
      clearInterval(petalInterval);
    };
  }, []);

  if (!isClient) {
    return (
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute"
          style={{
            left: `${petal.x}%`,
            width: petal.size,
            height: petal.size,
          }}
          initial={{
            y: -30,
            rotate: petal.rotation,
            opacity: 0,
          }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 50 : 1000,
            x: [
              0,
              windDirection * 30 + Math.sin(petal.id * 0.02) * 40,
              windDirection * -20 + Math.sin(petal.id * 0.03) * 60,
              windDirection * 50 + Math.sin(petal.id * 0.04) * 30,
              windDirection * -10 + Math.sin(petal.id * 0.05) * 80,
            ],
            rotate: [
              petal.rotation,
              petal.rotation + 90 + windDirection * 30,
              petal.rotation + 180 + windDirection * 60,
              petal.rotation + 270 + windDirection * 90,
              petal.rotation + 360 + windDirection * 120,
            ],
            opacity: [
              0,
              petal.opacity,
              petal.opacity * 0.8,
              petal.opacity * 0.6,
              0,
            ],
            scale: [0.3, 1, 1.1, 0.9, 0.2],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            ease: "easeInOut",
            times: [0, 0.2, 0.5, 0.8, 1],
          }}
          onAnimationComplete={() => {
            // Remove completed petals
            setPetals((prev) => prev.filter((p) => p.id !== petal.id));
          }}
        >
          {/* Enhanced SVG Sakura Petal with gradient */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg filter blur-[0.3px]"
          >
            <defs>
              <radialGradient
                id={`petalGrad${petal.id}`}
                cx="0.3"
                cy="0.3"
                r="0.8"
              >
                <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                <stop offset="40%" stopColor={petal.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={petal.color} stopOpacity="1" />
              </radialGradient>
              <filter id={`petalShadow${petal.id}`}>
                <feDropShadow
                  dx="1"
                  dy="2"
                  stdDeviation="1"
                  floodColor="#FF69B4"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            {/* Main petal shape */}
            <path
              d="M12 2C14.5 2 16.5 4.5 16.5 7.5C16.5 9 15.8 10.2 14.8 10.8C17.2 11.5 20.5 13.8 20.5 17C20.5 19.5 18.5 21 16 20.3C15.3 20.1 14.5 19.5 13.8 18.5C14.2 20.5 13.2 23 12 23C10.8 23 9.8 20.5 10.2 18.5C9.5 19.5 8.7 20.1 8 20.3C5.5 21 3.5 19.5 3.5 17C3.5 13.8 6.8 11.5 9.2 10.8C8.2 10.2 7.5 9 7.5 7.5C7.5 4.5 9.5 2 12 2Z"
              fill={`url(#petalGrad${petal.id})`}
              filter={`url(#petalShadow${petal.id})`}
            />

            {/* Inner shine */}
            <path
              d="M12 3.5C13.8 3.5 15 5.2 15 7C15 7.8 14.6 8.5 14 8.9C15.8 9.3 18.5 11 18.5 13.5C18.5 15.2 17.2 15.8 16 15.4C15.6 15.3 15.1 14.9 14.5 14.2C14.8 15.4 14.3 17.5 12 17.5C9.7 17.5 9.2 15.4 9.5 14.2C8.9 14.9 8.4 15.3 8 15.4C6.8 15.8 5.5 15.2 5.5 13.5C5.5 11 8.2 9.3 10 8.9C9.4 8.5 9 7.8 9 7C9 5.2 10.2 3.5 12 3.5Z"
              fill="white"
              fillOpacity="0.4"
            />

            {/* Center highlight */}
            <ellipse
              cx="12"
              cy="12"
              rx="2"
              ry="3"
              fill="white"
              fillOpacity="0.6"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
