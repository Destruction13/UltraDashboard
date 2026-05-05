"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay (s) before the reveal animation starts. */
  delay?: number;
  /** Distance (px) the element travels up while fading in. */
  distance?: number;
  /** Once revealed, do not re-animate when scrolled out and back. */
  once?: boolean;
  /** Render as `<section>` vs `<div>`. */
  as?: "div" | "section" | "header" | "article";
};

/**
 * Apple-style scroll reveal. Fades + lifts content as it enters the viewport.
 * Honours `prefers-reduced-motion: reduce` (renders the children flat). SSR
 * works because the initial / animate states agree on `display`.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 24,
  once = true,
  as = "div",
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = (() => {
    switch (as) {
      case "section":
        return motion.section;
      case "header":
        return motion.header;
      case "article":
        return motion.article;
      default:
        return motion.div;
    }
  })();

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}
