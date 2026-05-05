"use client";

import { Network, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import { LocaleToggle } from "@/components/shell/locale-toggle";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { cn } from "@/lib/cn";

type NavItem = {
  href: "/overview" | "/omniroute" | "/account-manager";
  labelKey: "overview" | "omniroute" | "accountManager";
  icon: typeof Sparkles;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/overview", labelKey: "overview", icon: Sparkles },
  { href: "/omniroute", labelKey: "omniroute", icon: Network },
  { href: "/account-manager", labelKey: "accountManager", icon: Users },
];

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <div className="glass-panel mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
        <Link href="/overview" className="group flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))] text-primary-foreground shadow-glass">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {t.brand.name}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              V1
            </span>
          </span>
        </Link>

        <nav className="ml-2 flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground/5 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.nav[item.labelKey]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
