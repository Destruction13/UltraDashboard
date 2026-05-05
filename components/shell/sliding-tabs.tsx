"use client";

import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Animated tab bar with a glowing spring-driven indicator. Adapted from
 * 21st.dev "Sliding Tabs" — but driven by `usePathname()` and `<Link>` for
 * Next.js App Router. The active tab is whichever item's `href` is the
 * longest prefix of the current pathname.
 *
 * `href` accepts a string. Next.js typed routes don't narrow dynamic-segment
 * targets like `/account-manager/[family]` to a literal `Route` union, so we
 * accept `string` and cast at the `<Link>` boundary. Consumers stay
 * responsible for passing real route strings.
 */
export type SlidingTabItem<TKey extends string = string> = {
  key: TKey;
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
};

type SlidingTabsProps<TKey extends string = string> = {
  items: SlidingTabItem<TKey>[];
  className?: string;
  ariaLabel?: string;
};

export function SlidingTabs<TKey extends string = string>({
  items,
  className,
  ariaLabel,
}: SlidingTabsProps<TKey>) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Pick the most-specific matching tab.
  const activeIndex = (() => {
    let best = -1;
    let bestLen = -1;
    items.forEach((item, idx) => {
      if (
        pathname &&
        (pathname === item.href || pathname.startsWith(item.href + "/")) &&
        item.href.length > bestLen
      ) {
        best = idx;
        bestLen = item.href.length;
      }
    });
    return best;
  })();

  const measure = useCallback(() => {
    const container = containerRef.current;
    const activeEl = activeIndex >= 0 ? tabRefs.current[activeIndex] : null;
    if (!container || !activeEl) return setIndicator(null);
    const cRect = container.getBoundingClientRect();
    const tRect = activeEl.getBoundingClientRect();
    setIndicator({ left: tRect.left - cRect.left, width: tRect.width });
  }, [activeIndex]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    tabRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <nav aria-label={ariaLabel} className={cn("w-full", className)}>
      <div
        ref={containerRef}
        role="tablist"
        className="relative inline-flex w-full items-center gap-1 rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--glass)/0.45)] p-1 backdrop-blur-xl"
      >
        {/* Glow blur layer behind the indicator. */}
        {indicator && (
          <motion.div
            initial={false}
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="pointer-events-none absolute rounded-xl"
            style={{ top: 6, height: "calc(100% - 12px)" }}
            aria-hidden
          >
            <div
              className="absolute inset-0 rounded-xl opacity-50 blur-2xl"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--shader-a)), hsl(var(--shader-b)), hsl(var(--shader-c)))",
              }}
            />
          </motion.div>
        )}

        {/* Solid sliding pill. */}
        {indicator && (
          <motion.div
            initial={false}
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-none absolute rounded-xl border border-[hsl(var(--glass-highlight)/0.35)] bg-[hsl(var(--card)/0.85)] shadow-[0_8px_28px_-12px_hsl(var(--shader-a)/0.55)]"
            style={{ top: 4, height: "calc(100% - 8px)" }}
            aria-hidden
          />
        )}

        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={item.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              aria-selected={isActive}
              href={item.href as Route}
              className={cn(
                "group relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-300",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.icon ? (
                <span className="text-foreground/70 transition-colors duration-300 group-hover:text-foreground">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-1 rounded-full bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
