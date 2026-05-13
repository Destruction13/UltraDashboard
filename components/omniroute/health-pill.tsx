import { AlertTriangle, Ban, CheckCircle2, CircleHelp, Hourglass } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { OmniRouteHealthStatus } from "@/lib/omniroute/types";

interface HealthPillProps {
  status: OmniRouteHealthStatus;
  label: string;
  hint?: string;
}

const TONE: Record<OmniRouteHealthStatus, "default" | "emerald" | "amber" | "rose" | "violet" | "sky"> =
  {
    active: "emerald",
    degraded: "amber",
    rate_limited: "amber",
    error: "rose",
    unknown: "default",
  };

const ICON: Record<OmniRouteHealthStatus, ReactNode> = {
  active: <CheckCircle2 className="h-3 w-3" />,
  degraded: <AlertTriangle className="h-3 w-3" />,
  rate_limited: <Hourglass className="h-3 w-3" />,
  error: <Ban className="h-3 w-3" />,
  unknown: <CircleHelp className="h-3 w-3" />,
};

/**
 * Bilingual-agnostic health pill for OmniRoute providers.
 * Display label is supplied by the page so the dictionary stays in one place.
 */
export function HealthPill({ status, label, hint }: HealthPillProps) {
  return (
    <Badge variant={TONE[status]} title={hint} className="inline-flex items-center gap-1">
      {ICON[status]}
      {label}
    </Badge>
  );
}
