import { cn } from "@/lib/cn";

/**
 * Phase tag.
 *
 * Small pill that flags placeholder content with the phase name from the
 * implementation tracker (e.g. "Phase 3", "Phase 5–6"). Used everywhere a
 * surface is intentionally not yet wired to real data.
 */
export function PhaseTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))]"
      />
      {children}
    </span>
  );
}
