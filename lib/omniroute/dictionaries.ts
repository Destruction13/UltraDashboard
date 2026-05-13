import type { Locale } from "@/lib/i18n/locales";

/**
 * Bilingual copy for the OmniRoute UI surface.
 *
 * Kept next to the OmniRoute domain code so the shell-level dictionary in
 * `lib/i18n/dictionaries.ts` does not balloon as new pages land.
 */

export type OmniRouteDictionary = {
  nav: {
    overview: string;
    providers: string;
    routes: string;
    liveRuns: string;
  };
  header: {
    title: string;
    description: string;
  };
  banner: {
    offline: string;
    offlineHint: string;
    refresh: string;
  };
  overview: {
    eyebrow: string;
    description: string;
    kpi: {
      providersTotal: string;
      providersTotalHint: string;
      providersActive: string;
      providersActiveHint: string;
      providersRateLimited: string;
      providersRateLimitedHint: string;
      providersWithErrors: string;
      providersWithErrorsHint: string;
      routesTotal: string;
      routesTotalHint: string;
      calls24h: string;
      calls24hHint: string;
      successRate24h: string;
      successRate24hHint: string;
      avgLatency24h: string;
      avgLatency24hHint: string;
      tokensIn24h: string;
      tokensIn24hHint: string;
      tokensOut24h: string;
      tokensOut24hHint: string;
      lastCall: string;
      lastCallHint: string;
    };
    cards: {
      topProvidersTitle: string;
      topProvidersDescription: string;
      windowsTitle: string;
      windowsDescription: string;
      recentTitle: string;
      recentDescription: string;
    };
    columns: {
      provider: string;
      calls: string;
      success: string;
      errors: string;
      avgLatency: string;
      tokensIn: string;
      tokensOut: string;
    };
    labels: {
      last24h: string;
      last7d: string;
      noData: string;
      manualRefresh: string;
      noTraffic: string;
    };
  };
  providers: {
    eyebrow: string;
    description: string;
    columns: {
      account: string;
      provider: string;
      health: string;
      priority: string;
      group: string;
      lastUsed: string;
      lastError: string;
    };
    health: {
      active: string;
      degraded: string;
      rate_limited: string;
      error: string;
      unknown: string;
    };
    filters: {
      searchPlaceholder: string;
      allProviders: string;
      allHealths: string;
      activeOnly: string;
      includeInactive: string;
    };
    empty: string;
    inactive: string;
    rateLimitedUntil: string;
  };
  routes: {
    eyebrow: string;
    description: string;
    columns: {
      name: string;
      sortOrder: string;
      steps: string;
      systemMessage: string;
      toolFilter: string;
      updated: string;
    };
    empty: string;
    none: string;
    untitledSystem: string;
  };
  liveRuns: {
    eyebrow: string;
    description: string;
    columns: {
      timestamp: string;
      method: string;
      path: string;
      status: string;
      model: string;
      provider: string;
      account: string;
      latency: string;
      tokensIn: string;
      tokensOut: string;
    };
    filters: {
      searchPlaceholder: string;
      allProviders: string;
      allStatuses: string;
      success: string;
      clientError: string;
      serverError: string;
      errorsOnly: string;
      showAll: string;
    };
    empty: string;
    combo: string;
  };
  shared: {
    rowsCount: string;
    refresh: string;
  };
};

const ru: OmniRouteDictionary = {
  nav: {
    overview: "Обзор",
    providers: "Провайдеры",
    routes: "Маршруты",
    liveRuns: "Живые запуски",
  },
  header: {
    title: "Зеркало OmniRoute",
    description:
      "Read-only снимок storage.sqlite на VPS. Дашборд только читает — ни одного запроса на запись в OmniRoute не уходит.",
  },
  banner: {
    offline: "OmniRoute сейчас недоступен",
    offlineHint:
      "Проверь монтирование `/var/omniroute/storage.sqlite` в контейнер и переменную `OMNIROUTE_SQLITE_PATH`.",
    refresh: "Обновить",
  },
  overview: {
    eyebrow: "OmniRoute · обзор",
    description:
      "Сводка по провайдерам, маршрутам и трафику. Данные читаются прямо из SQLite, без посредников.",
    kpi: {
      providersTotal: "Провайдеры — всего",
      providersTotalHint: "Включая выключенные",
      providersActive: "Активны",
      providersActiveHint: "is_active = 1",
      providersRateLimited: "Под рейт-лимитом",
      providersRateLimitedHint: "rate_limited_until > сейчас",
      providersWithErrors: "С последними ошибками",
      providersWithErrorsHint: "test_status ≠ active",
      routesTotal: "Маршруты (combos)",
      routesTotalHint: "Сохранённые цепочки",
      calls24h: "Запросов за 24ч",
      calls24hHint: "call_logs за последние 24 часа",
      successRate24h: "Доля успехов 24ч",
      successRate24hHint: "HTTP 2xx / всего",
      avgLatency24h: "Средняя задержка 24ч",
      avgLatency24hHint: "AVG(duration), мс",
      tokensIn24h: "Токены вход 24ч",
      tokensIn24hHint: "SUM(tokens_in)",
      tokensOut24h: "Токены выход 24ч",
      tokensOut24hHint: "SUM(tokens_out)",
      lastCall: "Последний запрос",
      lastCallHint: "MAX(timestamp) из call_logs",
    },
    cards: {
      topProvidersTitle: "Топ провайдеров",
      topProvidersDescription: "По количеству запросов за последние 24 часа.",
      windowsTitle: "Сравнение окон",
      windowsDescription: "24 часа vs. 7 дней.",
      recentTitle: "Последние события",
      recentDescription: "Время последнего успеха и последней ошибки.",
    },
    columns: {
      provider: "Провайдер",
      calls: "Запросов",
      success: "Успешно",
      errors: "Ошибок",
      avgLatency: "Ср. задержка",
      tokensIn: "Токены вход",
      tokensOut: "Токены выход",
    },
    labels: {
      last24h: "24 часа",
      last7d: "7 дней",
      noData: "Нет данных",
      manualRefresh: "Перечитать",
      noTraffic: "Трафика в окне не было",
    },
  },
  providers: {
    eyebrow: "OmniRoute · провайдеры",
    description: "Подключения провайдеров с состоянием здоровья и последней ошибкой.",
    columns: {
      account: "Аккаунт",
      provider: "Провайдер",
      health: "Здоровье",
      priority: "Приоритет",
      group: "Группа",
      lastUsed: "Использовался",
      lastError: "Последняя ошибка",
    },
    health: {
      active: "Активен",
      degraded: "Деградация",
      rate_limited: "Рейт-лимит",
      error: "Ошибка",
      unknown: "Неизвестно",
    },
    filters: {
      searchPlaceholder: "Поиск по имени / email / id",
      allProviders: "Все провайдеры",
      allHealths: "Любое состояние",
      activeOnly: "Только активные",
      includeInactive: "Показывать выключенные",
    },
    empty: "Подключений не найдено",
    inactive: "Выключен",
    rateLimitedUntil: "до",
  },
  routes: {
    eyebrow: "OmniRoute · маршруты",
    description: "Сохранённые комбинации (combos) — порядок, шаги, системный промпт.",
    columns: {
      name: "Имя",
      sortOrder: "Порядок",
      steps: "Шагов",
      systemMessage: "Системный промпт",
      toolFilter: "Tool-фильтр",
      updated: "Обновлено",
    },
    empty: "Маршруты пока не созданы",
    none: "—",
    untitledSystem: "(без системного промпта)",
  },
  liveRuns: {
    eyebrow: "OmniRoute · живые запуски",
    description: "Последние записи из call_logs. Обновляется при перезагрузке страницы.",
    columns: {
      timestamp: "Время",
      method: "Метод",
      path: "Путь",
      status: "Статус",
      model: "Модель",
      provider: "Провайдер",
      account: "Аккаунт",
      latency: "Задержка",
      tokensIn: "Вход",
      tokensOut: "Выход",
    },
    filters: {
      searchPlaceholder: "Поиск по модели / аккаунту / combo",
      allProviders: "Все провайдеры",
      allStatuses: "Любой статус",
      success: "2xx — успех",
      clientError: "4xx — клиент",
      serverError: "5xx — сервер",
      errorsOnly: "Только ошибки",
      showAll: "Показать все",
    },
    empty: "Запросов не найдено",
    combo: "combo",
  },
  shared: {
    rowsCount: "Показано {shown} из {total}",
    refresh: "Перезагрузить",
  },
};

const en: OmniRouteDictionary = {
  nav: {
    overview: "Overview",
    providers: "Providers",
    routes: "Routes",
    liveRuns: "Live runs",
  },
  header: {
    title: "OmniRoute mirror",
    description:
      "Read-only snapshot of storage.sqlite on the VPS. The dashboard only reads — no write requests are sent to OmniRoute.",
  },
  banner: {
    offline: "OmniRoute is currently unreachable",
    offlineHint:
      "Check that `/var/omniroute/storage.sqlite` is mounted into the container and `OMNIROUTE_SQLITE_PATH` is set.",
    refresh: "Refresh",
  },
  overview: {
    eyebrow: "OmniRoute · overview",
    description:
      "Provider, route, and traffic summary. Data is read directly from SQLite — no broker in between.",
    kpi: {
      providersTotal: "Providers — total",
      providersTotalHint: "Includes disabled ones",
      providersActive: "Active",
      providersActiveHint: "is_active = 1",
      providersRateLimited: "Rate limited",
      providersRateLimitedHint: "rate_limited_until > now",
      providersWithErrors: "With recent errors",
      providersWithErrorsHint: "test_status ≠ active",
      routesTotal: "Routes (combos)",
      routesTotalHint: "Stored router chains",
      calls24h: "Calls in 24h",
      calls24hHint: "call_logs over the last 24 hours",
      successRate24h: "Success rate 24h",
      successRate24hHint: "HTTP 2xx / total",
      avgLatency24h: "Avg latency 24h",
      avgLatency24hHint: "AVG(duration), ms",
      tokensIn24h: "Tokens in 24h",
      tokensIn24hHint: "SUM(tokens_in)",
      tokensOut24h: "Tokens out 24h",
      tokensOut24hHint: "SUM(tokens_out)",
      lastCall: "Last call",
      lastCallHint: "MAX(timestamp) from call_logs",
    },
    cards: {
      topProvidersTitle: "Top providers",
      topProvidersDescription: "By call count in the last 24 hours.",
      windowsTitle: "Windows comparison",
      windowsDescription: "24 hours vs. 7 days.",
      recentTitle: "Recent events",
      recentDescription: "Timestamps of the last success and the last error.",
    },
    columns: {
      provider: "Provider",
      calls: "Calls",
      success: "Success",
      errors: "Errors",
      avgLatency: "Avg latency",
      tokensIn: "Tokens in",
      tokensOut: "Tokens out",
    },
    labels: {
      last24h: "24 hours",
      last7d: "7 days",
      noData: "No data",
      manualRefresh: "Reload",
      noTraffic: "No traffic in this window",
    },
  },
  providers: {
    eyebrow: "OmniRoute · providers",
    description: "Provider connections with derived health state and the last error.",
    columns: {
      account: "Account",
      provider: "Provider",
      health: "Health",
      priority: "Priority",
      group: "Group",
      lastUsed: "Last used",
      lastError: "Last error",
    },
    health: {
      active: "Active",
      degraded: "Degraded",
      rate_limited: "Rate limited",
      error: "Error",
      unknown: "Unknown",
    },
    filters: {
      searchPlaceholder: "Search by name / email / id",
      allProviders: "All providers",
      allHealths: "Any health",
      activeOnly: "Active only",
      includeInactive: "Include disabled",
    },
    empty: "No provider connections matched",
    inactive: "Disabled",
    rateLimitedUntil: "until",
  },
  routes: {
    eyebrow: "OmniRoute · routes",
    description: "Stored combos — order, steps, and system message.",
    columns: {
      name: "Name",
      sortOrder: "Order",
      steps: "Steps",
      systemMessage: "System message",
      toolFilter: "Tool filter",
      updated: "Updated",
    },
    empty: "No combos defined yet",
    none: "—",
    untitledSystem: "(no system message)",
  },
  liveRuns: {
    eyebrow: "OmniRoute · live runs",
    description: "Most recent rows from call_logs. Refreshes on page reload.",
    columns: {
      timestamp: "Time",
      method: "Method",
      path: "Path",
      status: "Status",
      model: "Model",
      provider: "Provider",
      account: "Account",
      latency: "Latency",
      tokensIn: "In",
      tokensOut: "Out",
    },
    filters: {
      searchPlaceholder: "Search by model / account / combo",
      allProviders: "All providers",
      allStatuses: "Any status",
      success: "2xx — success",
      clientError: "4xx — client",
      serverError: "5xx — server",
      errorsOnly: "Errors only",
      showAll: "Show all",
    },
    empty: "No calls matched",
    combo: "combo",
  },
  shared: {
    rowsCount: "Showing {shown} of {total}",
    refresh: "Reload",
  },
};

const DICTIONARIES: Record<Locale, OmniRouteDictionary> = { ru, en };

export function getOmniRouteDictionary(locale: Locale): OmniRouteDictionary {
  return DICTIONARIES[locale];
}
