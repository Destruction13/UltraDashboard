import type { ReactNode } from "react";

import { StatCard } from "@/components/shell/stat-card";

/**
 * KPI tile.
 *
 * Thin compatibility wrapper around the premium {@link StatCard}. Keeps the
 * `KpiTile` prop shape that existing call-sites use while delegating the
 * actual rendering to the animated stat card. This way the dashboard gets the
 * full hover + halo + ray treatment without churning every page.
 */
export function KpiTile({
  label,
  value,
  hint,
  icon,
  loading = false,
  tone,
  className,
}: {
  label: ReactNode;
  value?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  tone?: "brand" | "violet" | "amber" | "emerald" | "rose" | "sky";
  className?: string;
}) {
  return (
    <StatCard
      label={label}
      value={value ?? "—"}
      caption={hint}
      icon={icon}
      loading={loading}
      tone={tone}
      className={className}
    />
  );
}
