"use client";

import type { ReactNode } from "react";

import { SlidingTabs, type SlidingTabItem } from "@/components/shell/sliding-tabs";

export type TabBarItem<TKey extends string = string> = {
  key: TKey;
  /**
   * Plain string href. With typedRoutes enabled, dynamic routes like
   * /account-manager/[family] do not match the bare `Route` type, so we accept
   * a string here and let the underlying tabs pass it to <Link> with a
   * typed-route cast. Consumers stay responsible for passing real route strings.
   */
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
};

/**
 * Glass tab bar.
 *
 * Compatibility wrapper around the premium {@link SlidingTabs} primitive
 * (animated indicator, glow blur, spring physics). Existing call-sites that
 * use `<TabBar>` keep working and inherit the new look.
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
  // SlidingTabs takes a mutable array; cast through a copy to satisfy types.
  const slidingItems: SlidingTabItem<TKey>[] = items.map((item) => ({
    key: item.key,
    href: item.href,
    label: item.label,
    icon: item.icon,
    badge: item.badge,
  }));
  return <SlidingTabs items={slidingItems} ariaLabel={ariaLabel} className={className} />;
}
