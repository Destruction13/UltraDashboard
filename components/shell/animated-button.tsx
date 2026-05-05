"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Premium animated button. Adapted from 21st.dev "Animated Gradient Button":
 *  - spring-driven hover scale (with optional rotateX tilt)
 *  - shimmer pass on the gradient variant
 *  - magnetic glow on hover for the default + gradient variants
 *  - SVG loading spinner
 * Honours `prefers-reduced-motion: reduce` and degrades gracefully.
 */
const animatedButtonVariants = cva(
  [
    "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
    "overflow-hidden transform-gpu",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_18px_48px_-24px_hsl(var(--primary)/0.55)] hover:shadow-[0_28px_72px_-24px_hsl(var(--primary)/0.65)]",
        gradient:
          "text-primary-foreground border border-[hsl(var(--glass-stroke)/0.55)] shadow-[0_18px_48px_-24px_hsl(var(--shader-a)/0.55)] hover:shadow-[0_28px_72px_-24px_hsl(var(--shader-b)/0.6)]",
        outline:
          "border border-[hsl(var(--glass-stroke)/0.7)] bg-[hsl(var(--card)/0.55)] text-foreground backdrop-blur-md hover:border-[hsl(var(--glass-stroke)/1)] hover:bg-[hsl(var(--card)/0.75)]",
        ghost:
          "bg-transparent text-foreground hover:bg-[hsl(var(--accent)/0.6)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, transition: { type: "spring", stiffness: 380, damping: 22 } },
  tap: { scale: 0.98, transition: { type: "spring", stiffness: 380, damping: 22 } },
};

const shimmerVariants: Variants = {
  initial: { x: "-110%" },
  animate: {
    x: "110%",
    transition: { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.6 },
  },
};

type AnimatedButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd"
> &
  VariantProps<typeof animatedButtonVariants> & {
    label: ReactNode;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    loading?: boolean;
  };

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    { label, variant, size, iconLeft, iconRight, loading, disabled, className, ...rest },
    ref,
  ) => {
    const reduceMotion = useReducedMotion();
    const isDisabled = !!disabled || !!loading;

    return (
      <motion.button
        ref={ref}
        className={cn(animatedButtonVariants({ variant, size }), className)}
        variants={buttonVariants}
        initial="initial"
        whileHover={isDisabled || reduceMotion ? "initial" : "hover"}
        whileTap={isDisabled || reduceMotion ? "initial" : "tap"}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {/* Gradient surface for the gradient variant. */}
        {variant === "gradient" && (
          <span
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(120deg, hsl(var(--shader-a)) 0%, hsl(var(--shader-b)) 50%, hsl(var(--shader-c)) 100%)",
            }}
          />
        )}

        {/* Shimmer pass — only the gradient variant. */}
        {variant === "gradient" && !reduceMotion && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />
        )}

        {/* Magnetic glow halo on hover. */}
        {(variant === "default" || variant === "gradient") && !reduceMotion && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-90"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--shader-a) / 0.4), hsl(var(--shader-b) / 0.4))",
            }}
          />
        )}

        {/* Content. */}
        <span className="relative z-10 inline-flex items-center gap-2">
          {loading ? <Spinner /> : iconLeft}
          <span>{label}</span>
          {iconRight}
        </span>
      </motion.button>
    );
  },
);
AnimatedButton.displayName = "AnimatedButton";

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
