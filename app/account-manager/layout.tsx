import { Github, Globe2, Mail } from "lucide-react";
import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { ScrollReveal } from "@/components/shell/scroll-reveal";
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
    <div className="flex flex-col gap-6">
      <ScrollReveal as="header" once distance={16}>
        <GlassPanel className="overflow-hidden p-6 sm:p-9">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--shader-a)/0.6)] to-transparent"
          />
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.55)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))]"
              />
              {t.nav.accountManager}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-[2.6rem]">
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                {locale === "ru"
                  ? "Хранилище аккаунтов и инструкций"
                  : "Account and instruction workspace"}
              </span>
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {locale === "ru"
                ? "Семейства GitHub / Google / Zoho, root-аккаунты и связанные сервисы. Левая колонка — учётные данные, правая — структурированные инструкции."
                : "GitHub / Google / Zoho families, root accounts and linked services. Credentials sit on the left, structured instructions on the right."}
            </p>
          </div>
        </GlassPanel>
      </ScrollReveal>

      <ScrollReveal once distance={12} delay={0.05}>
        <TabBar items={tabs} ariaLabel="Account families" />
      </ScrollReveal>

      <ScrollReveal once distance={20} delay={0.08}>
        {children}
      </ScrollReveal>
    </div>
  );
}
