"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { SectionHeader } from "@/components/shell/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLinkedServiceAction } from "@/lib/account-manager/actions";
import type { FamilySlug } from "@/lib/account-manager/families";

export type LinkedServiceCatalogOption = {
  slug: string;
  serviceName: string;
  defaultLoginUrl: string;
};

export type CreateLinkedServiceFormProps = {
  familySlug: FamilySlug;
  rootAccountId: string;
  catalog: ReadonlyArray<LinkedServiceCatalogOption>;
  copy: {
    toggleOpenLabel: string;
    toggleCloseLabel: string;
    title: string;
    description: string;
    presetLabel: string;
    presetPlaceholder: string;
    serviceName: string;
    serviceSlug: string;
    loginOrEmail: string;
    loginUrl: string;
    vaultItemId: string;
    vaultItemHint: string;
    passwordPlaintext: string;
    totpSecret: string;
    secretsHint: string;
    notes: string;
    tagSlugs: string;
    tagSlugsHint: string;
    submit: string;
  };
};

export function CreateLinkedServiceForm({
  familySlug,
  rootAccountId,
  catalog,
  copy,
}: CreateLinkedServiceFormProps) {
  const [open, setOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [loginUrl, setLoginUrl] = useState("");

  function applyPreset(slug: string) {
    const entry = catalog.find((option) => option.slug === slug);
    if (!entry) return;
    setServiceName(entry.serviceName);
    setServiceSlug(entry.slug);
    setLoginUrl(entry.defaultLoginUrl);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        {copy.toggleOpenLabel}
      </Button>
    );
  }

  return (
    <GlassPanel className="flex flex-col gap-4 p-5">
      <SectionHeader
        eyebrow={copy.toggleOpenLabel}
        title={copy.title}
        description={copy.description}
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="h-3.5 w-3.5" />
            {copy.toggleCloseLabel}
          </Button>
        }
      />
      <form action={createLinkedServiceAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="rootAccountId" value={rootAccountId} />

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="preset">{copy.presetLabel}</Label>
          <select
            id="preset"
            defaultValue=""
            onChange={(event) => applyPreset(event.target.value)}
            className="flex h-9 rounded-md border border-input bg-background/40 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{copy.presetPlaceholder}</option>
            {catalog.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.serviceName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serviceName">{copy.serviceName}</Label>
          <Input
            id="serviceName"
            name="serviceName"
            required
            maxLength={128}
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serviceSlug">{copy.serviceSlug}</Label>
          <Input
            id="serviceSlug"
            name="serviceSlug"
            required
            maxLength={64}
            value={serviceSlug}
            onChange={(event) => setServiceSlug(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="loginOrEmail">{copy.loginOrEmail}</Label>
          <Input id="loginOrEmail" name="loginOrEmail" maxLength={320} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="loginUrl">{copy.loginUrl}</Label>
          <Input
            id="loginUrl"
            name="loginUrl"
            type="url"
            value={loginUrl}
            onChange={(event) => setLoginUrl(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="vaultItemId">{copy.vaultItemId}</Label>
          <Input id="vaultItemId" name="vaultItemId" placeholder={copy.vaultItemHint} maxLength={64} />
          <p className="text-xs text-muted-foreground">{copy.vaultItemHint}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="passwordPlaintext">{copy.passwordPlaintext}</Label>
          <Input id="passwordPlaintext" name="passwordPlaintext" type="password" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totpSecretPlaintext">{copy.totpSecret}</Label>
          <Input
            id="totpSecretPlaintext"
            name="totpSecretPlaintext"
            type="text"
            autoComplete="off"
            placeholder="JBSWY3DPEHPK3PXP"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">{copy.secretsHint}</p>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="tagSlugs">{copy.tagSlugs}</Label>
          <Input id="tagSlugs" name="tagSlugs" placeholder={copy.tagSlugsHint} />
          <p className="text-xs text-muted-foreground">{copy.tagSlugsHint}</p>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="notes">{copy.notes}</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit">{copy.submit}</Button>
        </div>
      </form>
    </GlassPanel>
  );
}
