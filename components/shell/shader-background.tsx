import { cn } from "@/lib/cn";

/**
 * Ambient shader-backed atmosphere.
 *
 * V1 keeps the implementation CSS-only so it stays fast on the VPS and doesn't
 * require client JS or WebGL. Layered radial gradients use theme tokens so the
 * effect adapts to dark/light mode automatically. Slow drift via an
 * `aurora-drift` animation that respects `prefers-reduced-motion`. SVG film
 * grain on top adds the premium dust look. This is the foundation we can
 * later swap for a real WebGL or Magic-MCP shader without touching the rest of
 * the shell.
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

      {/* Top horizon line that anchors the navigation. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glass-stroke/60 to-transparent" />

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
