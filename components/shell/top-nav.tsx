"use client";

import { motion } from "framer-motion";
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
      <div className="relative">
        <div className="glass-panel mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link href="/overview" className="group flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))] text-primary-foreground shadow-glass transition-transform duration-300 group-hover:scale-110">
              <Sparkles className="relative z-10 h-4 w-4" />
              <span
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--glass-highlight)/0.6),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
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
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="ud-nav-lamp"
                      transition={{ type: "spring", stiffness: 280, damping: 30 }}
                      aria-hidden
                      className="absolute inset-0 rounded-md bg-foreground/[0.06] ring-1 ring-inset ring-[hsl(var(--glass-stroke)/0.6)]"
                    >
                      {/* Tube-light glow above the active link. */}
                      <span className="absolute -top-[3px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))]">
                        <span className="absolute -top-1.5 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-[hsl(var(--shader-b)/0.4)] blur-md" />
                      </span>
                    </motion.span>
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative hidden sm:inline">{t.nav[item.labelKey]}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
        {/* Aurora seam under the nav anchors the premium horizon line. */}
        <div className="aurora-seam mx-4 sm:mx-6" />
      </div>
    </header>
  );
}
