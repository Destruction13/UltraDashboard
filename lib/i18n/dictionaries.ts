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
    pendingFamilyData: string;
    pendingOmniRouteData: string;
    pendingOverviewData: string;
  };
  copy: {
    skipToContent: string;
    perimeterTrust: string;
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
    pendingFamilyData: "Появится в Phase 3 трекера: таблица root-аккаунтов, фильтры по тегам, поиск.",
    pendingOmniRouteData:
      "Появится в Phase 5–6: реальные данные провайдеров, статус туннеля и история синхронизаций.",
    pendingOverviewData:
      "Появится после Phase 1 и Phase 5: счётчики семейств, последняя синхронизация OmniRoute и пинированные инструкции.",
  },
  copy: {
    skipToContent: "Перейти к содержимому",
    perimeterTrust: "Доступ только через периметр / туннель",
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
    pendingFamilyData: "Lands in Phase 3: root account table, tag filtering, and search.",
    pendingOmniRouteData:
      "Lands in Phase 5–6: real provider data, tunnel status, and sync history.",
    pendingOverviewData:
      "Lands after Phase 1 and Phase 5: family counts, last OmniRoute sync, and pinned instructions.",
  },
  copy: {
    skipToContent: "Skip to content",
    perimeterTrust: "Reachable only through the perimeter / tunnel",
  },
};

const SHELL_DICTIONARIES: Record<Locale, ShellDictionary> = { ru, en };

export function getShellDictionary(locale: Locale): ShellDictionary {
  return SHELL_DICTIONARIES[locale];
}
