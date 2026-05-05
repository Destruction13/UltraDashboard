import Link from "next/link";

import { GlassPanel } from "@/components/shell/glass-panel";
import { Button } from "@/components/ui/button";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";

const COPY = {
  ru: {
    title: "Страница не найдена",
    description: "Похоже, по этому адресу ещё нет содержимого. Вернёмся в обзор?",
    cta: "К обзору",
  },
  en: {
    title: "Page not found",
    description: "Nothing lives at this URL yet. Head back to the overview?",
    cta: "Back to overview",
  },
} as const;

export default async function NotFound() {
  const locale = await readLocaleFromCookies();
  const copy = COPY[locale];
  return (
    <GlassPanel className="mx-auto mt-16 max-w-xl p-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{copy.description}</p>
      <Button asChild className="mt-6">
        <Link href="/overview">{copy.cta}</Link>
      </Button>
    </GlassPanel>
  );
}
