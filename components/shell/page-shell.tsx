import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { cn } from "@/lib/cn";

/**
 * Page shell.
 *
 * Premium page header pinned to the top of every primary route. Renders a
 * tall glass panel with an eyebrow, headline, optional description, and
 * inline actions on the right. Below it sits the page content slot.
 *
 * Used by `/overview`, `/omniroute`, and the `AccountManager` family pages so
 * they share the same rhythm and visual weight.
 */
export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 animate-fade-in", className)}>
      <GlassPanel className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex max-w-2xl flex-col gap-3">
            {eyebrow ? (
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))]"
                />
                {eyebrow}
              </span>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
              {actions}
            </div>
          ) : null}
        </div>
      </GlassPanel>
      {children ? <div className={contentClassName}>{children}</div> : null}
    </div>
  );
}
