import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Empty state.
 *
 * Used when a panel intentionally has no data yet. Different from a loading
 * skeleton — this is a *deliberate* "comes online in Phase X" signal.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-background/30 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--shader-a)/0.2)] via-[hsl(var(--shader-b)/0.2)] to-[hsl(var(--shader-c)/0.2)] text-foreground/80">
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
