import { Github, Globe2, Mail } from "lucide-react";
import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { TabBar, type TabBarItem } from "@/components/shell/tab-bar";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

type Family = "github" | "google" | "zoho";

export default async function AccountManagerLayout({ children }: { children: ReactNode }) {
  const locale = await readLocaleFromCookies();
  const t = getShellDictionary(locale);

  const tabs: ReadonlyArray<TabBarItem<Family>> = [
    {
      key: "github",
      href: "/account-manager/github",
      label: t.family.github,
      icon: <Github className="h-3.5 w-3.5" />,
    },
    {
      key: "google",
      href: "/account-manager/google",
      label: t.family.google,
      icon: <Globe2 className="h-3.5 w-3.5" />,
    },
    {
      key: "zoho",
      href: "/account-manager/zoho",
      label: t.family.zoho,
      icon: <Mail className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <GlassPanel className="flex flex-col gap-2 p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))]"
          />
          {t.nav.accountManager}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {locale === "ru"
            ? "Хранилище аккаунтов и инструкций"
            : "Account and instruction workspace"}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {locale === "ru"
            ? "Семейства GitHub / Google / Zoho, root-аккаунты и связанные сервисы. Левая колонка — учётные данные, правая — структурированные инструкции."
            : "GitHub / Google / Zoho families, root accounts and linked services. Credentials sit on the left, structured instructions on the right."}
        </p>
      </GlassPanel>

      <TabBar items={tabs} ariaLabel="Account families" />

      {children}
    </div>
  );
}
