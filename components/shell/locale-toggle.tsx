"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 px-2.5 text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("ru")}>
          {t.toggles.languageRu}
          {locale === "ru" ? (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("en")}>
          {t.toggles.languageEn}
          {locale === "en" ? (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
