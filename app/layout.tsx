import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ShaderBackground } from "@/components/shell/shader-background";
import { TopNav } from "@/components/shell/top-nav";
import { getShellDictionary } from "@/lib/i18n/dictionaries";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UltraDashboard",
  description: "Private operating dashboard for OmniRoute and AccountManager.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d18" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await readLocaleFromCookies();
  const t = getShellDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans`}>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <ShaderBackground />
            <a
              href="#ud-main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:text-primary-foreground"
            >
              {t.copy.skipToContent}
            </a>
            <TopNav />
            <main id="ud-main" className="relative px-4 pb-16 pt-6 sm:px-6">
              <div className="mx-auto max-w-[1400px]">{children}</div>
            </main>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
