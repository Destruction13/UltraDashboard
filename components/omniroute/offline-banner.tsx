import { AlertTriangle } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import type { OmniRouteDictionary } from "@/lib/omniroute/dictionaries";

interface OfflineBannerProps {
  copy: OmniRouteDictionary["banner"];
  storagePath?: string | null;
}

/**
 * Inline banner shown on every OmniRoute page when the SQLite mirror can't be
 * opened. Keeps the dashboard usable (other pages keep working) while pointing
 * the operator at the right diagnostic step.
 */
export function OmniRouteOfflineBanner({ copy, storagePath }: OfflineBannerProps) {
  return (
    <GlassPanel className="border-[hsl(var(--tag-amber)/0.4)] bg-[hsl(var(--tag-amber)/0.08)] p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-[hsl(var(--tag-amber))]" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">{copy.offline}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.offlineHint}</p>
          {storagePath ? (
            <code className="mt-1 inline-block w-fit rounded bg-[hsl(var(--card)/0.6)] px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {storagePath}
            </code>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  );
}
