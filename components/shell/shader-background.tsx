import { cn } from "@/lib/cn";

/**
 * Ambient shader-backed atmosphere.
 *
 * V1 keeps the implementation CSS-only so it stays fast on the VPS and doesn't
 * require client JS or WebGL. The radial gradients use theme tokens so the
 * effect adapts to dark/light mode automatically. This is the foundation we
 * can later upgrade to a real WebGL shader without touching the rest of the
 * shell.
 */
export function ShaderBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        "bg-shader-aurora",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glass-stroke/60 to-transparent" />
      <div
        className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--shader-a) / 0.45), transparent 70%)",
        }}
      />
      <div
        className="absolute -right-24 top-0 h-[360px] w-[360px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--shader-b) / 0.40), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-120px] left-1/3 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--shader-c) / 0.35), transparent 75%)",
        }}
      />
      {/* Subtle film grain via SVG noise — adds the premium dust look. */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="ud-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ud-noise)" />
      </svg>
    </div>
  );
}
