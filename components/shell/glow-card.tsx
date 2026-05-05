"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Mouse-tracking gradient glow card with hover scale. Adapted from 21st.dev
 * "Animated Card" — the hover gradient follows the cursor inside the card,
 * the card lifts/scales on hover, and the inner surface stays legible against
 * the underlying shell background. Renders fine without JS (just no glow).
 */
type GlowCardProps = {
  children: ReactNode;
  className?: string;
  /** Diameter (px) of the glow circle. */
  glowSize?: number;
  /** Tailwind/CSS gradient string used for the glow. Should include 4 stops. */
  glowGradient?: string;
  /** When true, the entire card scales up slightly on hover. */
  scaleOnHover?: boolean;
  /** Render an arrow icon in the top-right that lifts on hover. */
  withArrow?: boolean;
  /** Inner padding wrapper class — defaults to a tasteful 28px / 32px. */
  innerClassName?: string;
};

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, hsl(var(--shader-a)), hsl(var(--shader-b)), hsl(var(--shader-c)))";

export function GlowCard({
  children,
  className,
  glowSize = 360,
  glowGradient = DEFAULT_GRADIENT,
  scaleOnHover = true,
  withArrow = false,
  innerClassName,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };
    const onLeave = () => setPos(null);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius)] border bg-[hsl(var(--glass)/0.55)] p-[1px] transition-all duration-300",
        "border-[hsl(var(--glass-stroke)/0.55)] shadow-[0_18px_48px_-32px_hsl(var(--shader-a)/0.55)]",
        "hover:border-[hsl(var(--glass-stroke)/0.85)] hover:shadow-[0_28px_72px_-32px_hsl(var(--shader-b)/0.65)]",
        scaleOnHover && "transform-gpu hover:-translate-y-0.5 hover:scale-[1.012] active:scale-[0.99]",
        className,
      )}
    >
      {/* Mouse-tracked glow halo. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 mix-blend-screen blur-2xl transition-opacity duration-500",
          pos !== null && "opacity-100",
          "group-hover:opacity-100",
        )}
        style={{
          width: glowSize,
          height: glowSize,
          left: pos ? pos.x : "50%",
          top: pos ? pos.y : "50%",
          background: glowGradient,
          maskImage: `radial-gradient(${glowSize / 2}px circle at center, white, transparent)`,
          WebkitMaskImage: `radial-gradient(${glowSize / 2}px circle at center, white, transparent)`,
        }}
      />

      {/* Inner surface — sits above the glow but below the children. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[calc(var(--radius)-1px)] bg-[hsl(var(--card)/0.75)] backdrop-blur-xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[calc(var(--radius)-1px)] bg-gradient-to-br from-[hsl(var(--glass-highlight)/0.18)] via-transparent to-[hsl(var(--shader-b)/0.06)]"
      />

      {/* Foreground content. */}
      <div className={cn("relative z-10 p-7 sm:p-8", innerClassName)}>
        {withArrow && (
          <span
            aria-hidden
            className="absolute right-5 top-5 z-10 inline-flex h-8 w-8 translate-y-2 items-center justify-center rounded-full border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.6)] text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
