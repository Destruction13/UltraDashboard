import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/**
 * KPI tile.
 *
 * Compact, glass-friendly tile for top-level metrics on `/overview` and
 * `/omniroute`. When `loading` is true, swaps the value for a shimmer skeleton
 * so the layout doesn't shift between Phase 0 placeholders and Phase 1+ wired
 * data.
 */
export function KpiTile({
  label,
  value,
  hint,
  icon,
  loading = false,
  className,
}: {
  label: ReactNode;
  value?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border/60 bg-background/40 p-4 transition-colors hover:border-border/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/5 text-foreground/80">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {value ?? "—"}
          </span>
        )}
      </div>
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
