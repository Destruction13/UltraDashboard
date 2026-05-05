import type { Locale } from "@/lib/i18n/locales";

/**
 * Shell-level dictionary. Page-level strings live next to their pages so the
 * app can grow without one giant translation file.
 *
 * Keys are flat for fast lookup. Both languages must define the same keys.
 */

export type ShellDictionary = {
  brand: {
    name: string;
    tagline: string;
  };
  nav: {
    overview: string;
    omniroute: string;
    accountManager: string;
  };
  toggles: {
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    languageRu: string;
    languageEn: string;
  };
  family: {
    github: string;
    google: string;
    zoho: string;
  };
  states: {
    loading: string;
    empty: string;
    error: string;
  };
  copy: {
    skipToContent: string;
  };
};

const ru: ShellDictionary = {
  brand: {
    name: "UltraDashboard",
    tagline: "Внутренняя приборная панель OmniRoute и AccountManager",
  },
  nav: {
    overview: "Обзор",
    omniroute: "OmniRoute",
    accountManager: "AccountManager",
  },
  toggles: {
    themeLight: "Светлая",
    themeDark: "Тёмная",
    themeSystem: "Системная",
    languageRu: "Русский",
    languageEn: "English",
  },
  family: {
    github: "GitHub",
    google: "Google",
    zoho: "Zoho",
  },
  states: {
    loading: "Загрузка…",
    empty: "Пока пусто",
    error: "Что-то пошло не так",
  },
  copy: {
    skipToContent: "Перейти к содержимому",
  },
};

const en: ShellDictionary = {
  brand: {
    name: "UltraDashboard",
    tagline: "Private operating dashboard for OmniRoute and AccountManager",
  },
  nav: {
    overview: "Overview",
    omniroute: "OmniRoute",
    accountManager: "AccountManager",
  },
  toggles: {
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    languageRu: "Русский",
    languageEn: "English",
  },
  family: {
    github: "GitHub",
    google: "Google",
    zoho: "Zoho",
  },
  states: {
    loading: "Loading…",
    empty: "Nothing here yet",
    error: "Something went wrong",
  },
  copy: {
    skipToContent: "Skip to content",
  },
};

const SHELL_DICTIONARIES: Record<Locale, ShellDictionary> = { ru, en };

export function getShellDictionary(locale: Locale): ShellDictionary {
  return SHELL_DICTIONARIES[locale];
}
