import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { ScrollReveal } from "@/components/shell/scroll-reveal";
import { cn } from "@/lib/cn";

/**
 * Page shell.
 *
 * Premium page header pinned to the top of every primary route. Renders a
 * tall glass panel with an eyebrow, headline, optional description, and
 * inline actions on the right. The header lifts/fades in on mount and any
 * children below scroll-reveal individually as they enter the viewport.
 *
 * Used by `/overview`, `/omniroute`, and the `AccountManager` family pages so
 * they share the same rhythm and visual weight.
 */
export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  hero,
  children,
  className,
  contentClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional premium content rendered to the right of the description (e.g. status pill). */
  hero?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <ScrollReveal as="header" once distance={16}>
        <GlassPanel className="overflow-hidden p-6 sm:p-9">
          {/* Inner glow line at the top of the panel. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--shader-a)/0.6)] to-transparent"
          />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="flex max-w-3xl flex-col gap-3">
              {eyebrow ? (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.55)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))]"
                  />
                  {eyebrow}
                </span>
              ) : null}
              <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl md:text-[2.6rem]">
                <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {description ? (
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {description}
                </p>
              ) : null}
            </div>
            {actions || hero ? (
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-end">
                {hero}
                {actions}
              </div>
            ) : null}
          </div>
        </GlassPanel>
      </ScrollReveal>

      {children ? (
        <ScrollReveal once distance={20} delay={0.05} className={contentClassName}>
          {children}
        </ScrollReveal>
      ) : null}
    </div>
  );
}
