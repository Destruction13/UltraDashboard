import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Section header.
 *
 * Pairs a small uppercase eyebrow with a section title and optional inline
 * actions (refresh button, link, etc). Used inside `<PageShell>` and standalone
 * `<GlassPanel>`s.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
