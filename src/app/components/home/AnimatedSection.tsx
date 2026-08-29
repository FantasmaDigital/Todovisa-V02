"use client";

import React from "react";
import { motion, UseInViewOptions } from "motion/react";

type AnimationVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "scale-up";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: AnimationVariant;
  viewportOptions?: UseInViewOptions;
}

const getVariantStyles = (variant: AnimationVariant) => {
  switch (variant) {
    case "fade-up":
      return {
        initial: { opacity: 0, y: 35 },
        animate: { opacity: 1, y: 0 },
      };
    case "fade-down":
      return {
        initial: { opacity: 0, y: -35 },
        animate: { opacity: 1, y: 0 },
      };
    case "fade-left":
      return {
        initial: { opacity: 0, x: -40 },
        animate: { opacity: 1, x: 0 },
      };
    case "fade-right":
      return {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
      };
    case "zoom-in":
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
      };
    case "scale-up":
      return {
        initial: { opacity: 0, scale: 0.88, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };
    default:
      return {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
      };
  }
};

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  variant = "fade-up",
  viewportOptions = { once: true, margin: "-60px" },
}: AnimatedSectionProps) {
  const styles = getVariantStyles(variant);
  // Normalize delay if passed in milliseconds (e.g. 150 -> 0.15)
  const normalizedDelay = delay > 10 ? delay / 1000 : delay;

  return (
    <motion.div
      className={className}
      initial={styles.initial}
      whileInView={styles.animate}
      viewport={viewportOptions}
      transition={{
        duration,
        delay: normalizedDelay,
        ease: [0.22, 1, 0.36, 1], // Smooth cubic-bezier cubic out
      }}
    >
      {children}
    </motion.div>
  );
}
