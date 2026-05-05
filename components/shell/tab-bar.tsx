"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TabBarItem<TKey extends string = string> = {
  key: TKey;
  /**
   * Plain string href. With typedRoutes enabled, dynamic routes like
   * /account-manager/[family] do not match the bare `Route` type, so we accept
   * a string here and let the TabBar pass it to <Link> with a typed-route cast.
   * Consumers stay responsible for passing real route strings.
   */
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
};

/**
 * Glass tab bar.
 *
 * Renders a horizontal pill rail with an animated active background driven by
 * the current pathname. Used by the AccountManager family tabs and any other
 * place that needs a Linear-style segmented control.
 */
export function TabBar<TKey extends string = string>({
  items,
  ariaLabel,
  className,
}: {
  items: ReadonlyArray<TabBarItem<TKey>>;
  ariaLabel: string;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "glass-panel glass-panel--rail relative flex w-full overflow-hidden p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative z-[1] flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-md bg-foreground/5 ring-1 ring-inset ring-border/60"
              />
            ) : null}
            {item.icon ? (
              <span className="flex h-4 w-4 items-center justify-center text-current">
                {item.icon}
              </span>
            ) : null}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.badge ? (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-background/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.badge}
              </span>
            ) : null}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-[hsl(var(--shader-a)/0.7)] to-transparent"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
