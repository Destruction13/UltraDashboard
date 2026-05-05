import { Github, Globe2, Mail } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

type Family = "github" | "google" | "zoho";

const FAMILIES: ReadonlyArray<{ slug: Family; icon: typeof Github }> = [
  { slug: "github", icon: Github },
  { slug: "google", icon: Globe2 },
  { slug: "zoho", icon: Mail },
];

export default async function AccountManagerLayout({ children }: { children: ReactNode }) {
  const locale = await readLocaleFromCookies();
  const t = getShellDictionary(locale);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <GlassPanel className="flex flex-col gap-2 p-6">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t.nav.accountManager}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {locale === "ru"
            ? "Хранилище аккаунтов и инструкций"
            : "Account and instruction workspace"}
        </h1>
      </GlassPanel>

      <nav
        aria-label="Account families"
        className="glass-panel flex w-full overflow-hidden p-1"
      >
        {FAMILIES.map((family) => {
          const Icon = family.icon;
          return (
            <Link
              key={family.slug}
              href={`/account-manager/${family.slug}` as const}
              className="group flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground aria-[current=page]:bg-foreground/5 aria-[current=page]:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {t.family[family.slug]}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
