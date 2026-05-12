"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  useId,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { FamilySlug } from "@/lib/account-manager/families";

const SERVICE_OPTIONS = [
  { slug: "chatgpt", label: "ChatGPT" },
  { slug: "codex", label: "Codex" },
  { slug: "github", label: "GitHub" },
  { slug: "devin", label: "Devin" },
  { slug: "zoho", label: "Zoho" },
];

const INPUT_CLASS_NAME =
  "w-full rounded-xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.55)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-ring";

const TEXTAREA_CLASS_NAME = `${INPUT_CLASS_NAME} min-h-[112px] resize-y`;

type Locale = "ru" | "en";

type RootState = {
  displayName: string;
  primaryEmail: string;
  username: string;
};

type ServiceState = {
  title: string;
  serviceSlug: string;
  serviceName: string;
  loginOrEmail: string;
  password: string;
  totpSecret: string;
  loginUrl: string;
  notes: string;
};

const COPY = {
  ru: {
    rootFormTitle: "Новая запись на сервере",
    rootFormHint:
      "Создаёт первый linked service в Vaultwarden и сразу делает его видимым в текущем family-разделе.",
    linkedFormTitle: "Добавить linked service",
    linkedFormHint:
      "Новая запись будет создана прямо в серверном Vaultwarden и сразу появится в списке этого root-аккаунта.",
    editFormTitle: "Редактировать запись",
    editFormHint: "Изменения записываются в серверный Vaultwarden через bw serve.",
    deleteTitle: "Удалить запись",
    deleteHint: "Удаление происходит в Vaultwarden. После этого item пропадёт из дашборда.",
    rootDisplayName: "Имя root-аккаунта",
    rootPrimaryEmail: "Primary email",
    rootUsername: "Username root-аккаунта",
    itemTitle: "Название item",
    serviceSlug: "Service slug",
    serviceName: "Service name",
    loginOrEmail: "Логин / email",
    password: "Пароль",
    totpSecret: "TOTP secret",
    loginUrl: "Login URL",
    notes: "Заметки",
    create: "Создать на сервере",
    addService: "Добавить в root",
    save: "Сохранить в Vaultwarden",
    deleting: "Удаляю...",
    delete: "Удалить запись",
    successCreated: "Запись создана. Открываю detail-view...",
    successSaved: "Изменения сохранены в Vaultwarden.",
    errorPrefix: "Ошибка",
    placeholders: {
      rootDisplayName: "Например, Google main account",
      rootPrimaryEmail: "name@example.com",
      rootUsername: "optional-root-username",
      itemTitle: "Например, ChatGPT Plus / Main",
      serviceSlug: "chatgpt",
      serviceName: "Custom service name",
      loginOrEmail: "operator@example.com",
      password: "Пароль или access secret",
      totpSecret: "JBSWY3DPEHPK3PXP",
      loginUrl: "https://...",
      notes: "Любые заметки для этой записи",
    },
  },
  en: {
    rootFormTitle: "New server entry",
    rootFormHint:
      "Creates the first linked service in Vaultwarden and makes it immediately visible under this family.",
    linkedFormTitle: "Add linked service",
    linkedFormHint:
      "The new entry is created directly in server-side Vaultwarden and appears in this root account immediately.",
    editFormTitle: "Edit entry",
    editFormHint: "Changes are written back to server-side Vaultwarden through bw serve.",
    deleteTitle: "Delete entry",
    deleteHint: "Deletion happens in Vaultwarden. The item disappears from the dashboard afterwards.",
    rootDisplayName: "Root account name",
    rootPrimaryEmail: "Primary email",
    rootUsername: "Root username",
    itemTitle: "Item title",
    serviceSlug: "Service slug",
    serviceName: "Service name",
    loginOrEmail: "Login / email",
    password: "Password",
    totpSecret: "TOTP secret",
    loginUrl: "Login URL",
    notes: "Notes",
    create: "Create on server",
    addService: "Add to root",
    save: "Save to Vaultwarden",
    deleting: "Deleting...",
    delete: "Delete entry",
    successCreated: "Entry created. Opening the detail view...",
    successSaved: "Changes saved to Vaultwarden.",
    errorPrefix: "Error",
    placeholders: {
      rootDisplayName: "For example, Google main account",
      rootPrimaryEmail: "name@example.com",
      rootUsername: "optional-root-username",
      itemTitle: "For example, ChatGPT Plus / Main",
      serviceSlug: "chatgpt",
      serviceName: "Custom service name",
      loginOrEmail: "operator@example.com",
      password: "Password or access secret",
      totpSecret: "JBSWY3DPEHPK3PXP",
      loginUrl: "https://...",
      notes: "Any notes for this entry",
    },
  },
} as const;

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed with status ${response.status}.`);
  }

  return payload?.data as T;
}

function buildDefaultServiceState(serviceSlug = "chatgpt"): ServiceState {
  return {
    title: "",
    serviceSlug,
    serviceName: "",
    loginOrEmail: "",
    password: "",
    totpSecret: "",
    loginUrl: "",
    notes: "",
  };
}

function handleObjectChange<T extends Record<string, string>>(
  setter: (value: T | ((previous: T) => T)) => void,
) {
  return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setter((previous) => ({ ...previous, [name]: value }));
  };
}

function ServiceFields({
  locale,
  state,
  onChange,
}: {
  locale: Locale;
  state: ServiceState;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const copy = COPY[locale];
  const serviceListId = useId();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={copy.itemTitle}>
        <input
          className={INPUT_CLASS_NAME}
          name="title"
          value={state.title}
          onChange={onChange}
          placeholder={copy.placeholders.itemTitle}
        />
      </Field>

      <Field label={copy.serviceSlug}>
        <>
          <input
            className={INPUT_CLASS_NAME}
            name="serviceSlug"
            value={state.serviceSlug}
            onChange={onChange}
            list={serviceListId}
            placeholder={copy.placeholders.serviceSlug}
            required
          />
          <datalist id={serviceListId}>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </datalist>
        </>
      </Field>

      <Field label={copy.serviceName}>
        <input
          className={INPUT_CLASS_NAME}
          name="serviceName"
          value={state.serviceName}
          onChange={onChange}
          placeholder={copy.placeholders.serviceName}
        />
      </Field>

      <Field label={copy.loginOrEmail}>
        <input
          className={INPUT_CLASS_NAME}
          name="loginOrEmail"
          value={state.loginOrEmail}
          onChange={onChange}
          placeholder={copy.placeholders.loginOrEmail}
        />
      </Field>

      <Field label={copy.password}>
        <input
          className={INPUT_CLASS_NAME}
          type="password"
          name="password"
          value={state.password}
          onChange={onChange}
          placeholder={copy.placeholders.password}
        />
      </Field>

      <Field label={copy.totpSecret}>
        <input
          className={INPUT_CLASS_NAME}
          name="totpSecret"
          value={state.totpSecret}
          onChange={onChange}
          placeholder={copy.placeholders.totpSecret}
        />
      </Field>

      <Field label={copy.loginUrl} className="sm:col-span-2">
        <input
          className={INPUT_CLASS_NAME}
          name="loginUrl"
          value={state.loginUrl}
          onChange={onChange}
          placeholder={copy.placeholders.loginUrl}
        />
      </Field>

      <Field label={copy.notes} className="sm:col-span-2">
        <textarea
          className={TEXTAREA_CLASS_NAME}
          name="notes"
          value={state.notes}
          onChange={onChange}
          placeholder={copy.placeholders.notes}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Feedback({ error, success, locale }: { error: string | null; success: string | null; locale: Locale }) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-xl border px-3 py-2 text-sm",
        error
          ? "border-[hsl(var(--tag-rose)/0.35)] bg-[hsl(var(--tag-rose)/0.08)] text-[hsl(var(--tag-rose))]"
          : "border-[hsl(var(--tag-emerald)/0.35)] bg-[hsl(var(--tag-emerald)/0.08)] text-[hsl(var(--tag-emerald))]",
      ].join(" ")}
    >
      {error ? `${COPY[locale].errorPrefix}: ${error}` : success}
    </div>
  );
}

export function CreateRootAccountForm({ family, locale }: { family: FamilySlug; locale: Locale }) {
  const copy = COPY[locale];
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [root, setRoot] = useState<RootState>({ displayName: "", primaryEmail: "", username: "" });
  const [service, setService] = useState<ServiceState>(() => buildDefaultServiceState());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const data = await requestJson<{ rootAccountId: string; linkedServiceId: string }>(
        "/api/internal/root-accounts",
        {
          method: "POST",
          body: JSON.stringify({
            root: { family, ...root },
            linkedService: service,
          }),
        },
      );

      setSuccess(copy.successCreated);
      startTransition(() => {
        router.push(
          `/account-manager/${family}/${data.rootAccountId}/services/${data.linkedServiceId}`,
        );
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = isSubmitting || isRefreshing;

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{copy.rootFormTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{copy.rootFormHint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={copy.rootDisplayName} className="sm:col-span-3">
          <input
            className={INPUT_CLASS_NAME}
            name="displayName"
            value={root.displayName}
            onChange={handleObjectChange(setRoot)}
            placeholder={copy.placeholders.rootDisplayName}
            required
          />
        </Field>

        <Field label={copy.rootPrimaryEmail}>
          <input
            className={INPUT_CLASS_NAME}
            name="primaryEmail"
            value={root.primaryEmail}
            onChange={handleObjectChange(setRoot)}
            placeholder={copy.placeholders.rootPrimaryEmail}
          />
        </Field>

        <Field label={copy.rootUsername} className="sm:col-span-2">
          <input
            className={INPUT_CLASS_NAME}
            name="username"
            value={root.username}
            onChange={handleObjectChange(setRoot)}
            placeholder={copy.placeholders.rootUsername}
          />
        </Field>
      </div>

      <ServiceFields locale={locale} state={service} onChange={handleObjectChange(setService)} />
      <Feedback error={error} success={success} locale={locale} />

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {copy.create}
        </Button>
      </div>
    </form>
  );
}

export function CreateLinkedServiceForm({
  family,
  rootAccountId,
  locale,
}: {
  family: FamilySlug;
  rootAccountId: string;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [service, setService] = useState<ServiceState>(() => buildDefaultServiceState());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const data = await requestJson<{ rootAccountId: string; linkedServiceId: string }>(
        `/api/internal/root-accounts/${rootAccountId}/linked-services`,
        {
          method: "POST",
          body: JSON.stringify({ family, linkedService: service }),
        },
      );

      setSuccess(copy.successCreated);
      startTransition(() => {
        router.push(
          `/account-manager/${family}/${data.rootAccountId}/services/${data.linkedServiceId}`,
        );
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = isSubmitting || isRefreshing;

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{copy.linkedFormTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{copy.linkedFormHint}</p>
      </div>

      <ServiceFields locale={locale} state={service} onChange={handleObjectChange(setService)} />
      <Feedback error={error} success={success} locale={locale} />

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {copy.addService}
        </Button>
      </div>
    </form>
  );
}

export function EditLinkedServiceForm({
  family,
  rootAccountId,
  accountId,
  locale,
  initial,
}: {
  family: FamilySlug;
  rootAccountId: string;
  accountId: string;
  locale: Locale;
  initial: ServiceState;
}) {
  const copy = COPY[locale];
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [service, setService] = useState<ServiceState>(initial);

  function buildPatchPayload() {
    const nextEntries = Object.entries(service).filter(([key, value]) => {
      const previousValue = initial[key as keyof ServiceState] ?? "";
      return value !== previousValue;
    });

    return Object.fromEntries(nextEntries);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const patchPayload = buildPatchPayload();
      if (Object.keys(patchPayload).length === 0) {
        setSuccess(copy.successSaved);
        return;
      }

      await requestJson<{ rootAccountId: string; linkedServiceId: string }>(
        `/api/internal/linked-service-accounts/${accountId}`,
        {
          method: "PATCH",
          body: JSON.stringify(patchPayload),
        },
      );

      setSuccess(copy.successSaved);
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(copy.deleteHint);
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      await requestJson<{ deleted: boolean }>(`/api/internal/linked-service-accounts/${accountId}`, {
        method: "DELETE",
      });

      startTransition(() => {
        router.push(`/account-manager/${family}/${rootAccountId}`);
        router.refresh();
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unknown error.");
    } finally {
      setIsDeleting(false);
    }
  }

  const disabled = isSubmitting || isDeleting || isRefreshing;

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{copy.editFormTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{copy.editFormHint}</p>
      </div>

      <ServiceFields locale={locale} state={service} onChange={handleObjectChange(setService)} />
      <Feedback error={error} success={success} locale={locale} />

      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {copy.deleteTitle}
          </h4>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">{copy.deleteHint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={disabled}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? copy.deleting : copy.delete}
          </Button>

          <Button type="submit" disabled={disabled}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {copy.save}
          </Button>
        </div>
      </div>
    </form>
  );
}
