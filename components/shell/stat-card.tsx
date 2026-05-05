"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Premium KPI stat card. Adapted from 21st.dev "Stat Card" — a moving halo
 * + slowly-rotating ray + bottom seams + textShadow pulse on the value.
 *
 * Designed to slot directly into a 4-up KPI grid on `/overview` and
 * `/omniroute`. The card is server-renderable except for the framer-motion
 * pieces, which are scoped behind `motion.*` (they degrade to static on the
 * server).
 */
type StatCardProps = {
  /** Section eyebrow above the value (e.g. "Service families"). */
  label: ReactNode;
  /** Primary value (e.g. "3" or "Lands in Phase 5"). */
  value: ReactNode;
  /** Optional caption rendered under the value. */
  caption?: ReactNode;
  /** Optional small icon shown next to the eyebrow. Pass a JSX element so it
   *  can cross the server/client boundary safely (the icon component itself
   *  is a function and cannot be passed as a raw prop from RSC). */
  icon?: ReactNode;
  /** Render a shimmer placeholder instead of a value. */
  loading?: boolean;
  /** Tone hint that drives the gradient halo (defaults to brand). */
  tone?: "brand" | "violet" | "amber" | "emerald" | "rose" | "sky";
  className?: string;
};

const toneGradient: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand:
    "from-[hsl(var(--shader-a)/0.25)] via-[hsl(var(--shader-b)/0.18)] to-[hsl(var(--shader-c)/0.20)]",
  violet:
    "from-[hsl(var(--tag-violet)/0.30)] via-[hsl(var(--shader-b)/0.18)] to-[hsl(var(--tag-violet)/0.10)]",
  amber:
    "from-[hsl(var(--tag-amber)/0.30)] via-[hsl(var(--shader-a)/0.10)] to-[hsl(var(--tag-amber)/0.10)]",
  emerald:
    "from-[hsl(var(--tag-emerald)/0.30)] via-[hsl(var(--shader-c)/0.16)] to-[hsl(var(--tag-emerald)/0.10)]",
  rose:
    "from-[hsl(var(--tag-rose)/0.30)] via-[hsl(var(--shader-b)/0.16)] to-[hsl(var(--tag-rose)/0.10)]",
  sky:
    "from-[hsl(var(--tag-sky)/0.30)] via-[hsl(var(--shader-c)/0.16)] to-[hsl(var(--tag-sky)/0.10)]",
};

export function StatCard({
  label,
  value,
  caption,
  icon,
  loading = false,
  tone = "brand",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius)] border border-[hsl(var(--glass-stroke)/0.55)]",
        "bg-gradient-to-br",
        toneGradient[tone],
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:shadow-[0_28px_72px_-32px_hsl(var(--shader-a)/0.55)]",
        className,
      )}
    >
      {/* Moving halo. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute h-20 w-20 rounded-full bg-[hsl(var(--shader-a)/0.30)] blur-3xl"
        animate={{
          top: ["8%", "8%", "72%", "72%", "8%"],
          left: ["8%", "78%", "78%", "8%", "8%"],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      {/* Slow rotating ray under the inner card. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--shader-b)/0.18)] blur-2xl"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex h-full flex-col rounded-[calc(var(--radius)-1px)] bg-[hsl(var(--card)/0.65)] p-5 backdrop-blur-xl">
        {/* Subtle bottom + top hairlines. */}
        <span className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-[hsl(var(--glass-highlight)/0.4)] to-transparent" />
        <span className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-gradient-to-r from-transparent to-[hsl(var(--shader-b)/0.45)]" />

        {/* Eyebrow row. */}
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <span>{label}</span>
          {icon ? (
            <span
              aria-hidden
              className="text-foreground/60 transition-transform duration-500 group-hover:rotate-12 group-hover:text-foreground [&_svg]:h-4 [&_svg]:w-4"
            >
              {icon}
            </span>
          ) : null}
        </div>

        {/* Value. */}
        <div className="mt-4">
          {loading ? (
            <div
              className="shimmer-bar h-8 w-24 rounded-md"
              role="status"
              aria-label="Loading metric"
            />
          ) : (
            <motion.span
              className="block text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              animate={{
                textShadow: [
                  "0 0 0 hsl(var(--shader-a) / 0)",
                  "0 0 18px hsl(var(--shader-a) / 0.35)",
                  "0 0 0 hsl(var(--shader-a) / 0)",
                ],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {value}
            </motion.span>
          )}
        </div>

        {caption ? (
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}
