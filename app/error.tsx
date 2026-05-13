"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GlassPanel className="mx-auto mt-16 max-w-xl p-10 text-center">
      <div className="mb-4 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Что-то пошло не так</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Дашборд вернул необработанную ошибку. Попробуйте обновить страницу — если повторится,
        проверьте состояние контейнера и снимка OmniRoute на VPS.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted-foreground/80">
          digest: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
      <Button onClick={() => reset()} className="mt-6">
        <RotateCcw className="mr-2 h-4 w-4" />
        Попробовать снова
      </Button>
    </GlassPanel>
  );
}
