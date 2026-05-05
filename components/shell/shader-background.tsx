import { cn } from "@/lib/cn";

import { ShaderCanvas } from "./shader-canvas";

/**
 * Ambient shader-backed atmosphere.
 *
 * Sits behind the rest of the shell. Three layers:
 *   1. Theme-aware radial gradients (CSS) — always rendered, drives the base
 *      mood and gives a graceful no-JS / SSR fallback.
 *   2. WebGL aurora canvas (client only, opt-out on `prefers-reduced-motion`).
 *   3. SVG film grain on top — adds the premium dust look.
 *
 * Token-driven so the palette responds to dark/light theme switches.
 */
export function ShaderBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* Layered radial gradients with slow drift. */}
      <div className="aurora-drift absolute inset-0">
        <div
          className="absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--shader-a) / 0.55), transparent 70%)",
          }}
        />
        <div
          className="absolute -right-24 -top-12 h-[440px] w-[440px] rounded-full opacity-55 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--shader-b) / 0.50), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-160px] left-1/3 h-[560px] w-[560px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--shader-c) / 0.45), transparent 75%)",
          }}
        />
        <div
          className="absolute right-1/4 bottom-1/3 h-[280px] w-[280px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--shader-a) / 0.30), transparent 75%)",
          }}
        />
      </div>

      {/* WebGL aurora layer — adds living colour without dominating the page. */}
      <ShaderCanvas className="opacity-70 mix-blend-screen dark:mix-blend-screen" intensity={0.55} />

      {/* Top horizon line that anchors the navigation. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glass-stroke/60 to-transparent" />

      {/* Subtle dot grid pattern — gives the dashboard ground. */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground) / 0.7) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 50%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 50%, transparent 85%)",
        }}
      />

      {/* Subtle film grain via SVG noise — adds the premium dust look. */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay">
        <filter id="ud-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ud-noise)" />
      </svg>
    </div>
  );
}
