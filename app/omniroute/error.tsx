"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { Button } from "@/components/ui/button";

export default function OmniRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GlassPanel className="flex flex-col items-start gap-3 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">
          OmniRoute временно недоступен
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Не удалось прочитать снимок OmniRoute. На VPS проверь `systemctl status
        omniroute-snapshot.timer` и `ls -la /root/.omniroute-snapshot/`. Дашборд продолжит
        работать в офлайн-режиме (списки будут пустыми, AccountManager не затронут).
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground/80">
          digest: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
      <Button onClick={() => reset()} variant="outline">
        <RotateCcw className="mr-2 h-3.5 w-3.5" />
        Перезагрузить
      </Button>
    </GlassPanel>
  );
}
