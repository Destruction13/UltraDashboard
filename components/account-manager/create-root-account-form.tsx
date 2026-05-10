"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { SectionHeader } from "@/components/shell/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRootAccountAction } from "@/lib/account-manager/actions";
import type { FamilySlug } from "@/lib/account-manager/families";

export type CreateRootAccountFormProps = {
  familySlug: FamilySlug;
  copy: {
    toggleOpenLabel: string;
    toggleCloseLabel: string;
    title: string;
    description: string;
    displayName: string;
    primaryEmail: string;
    username: string;
    notes: string;
    submit: string;
  };
};

export function CreateRootAccountForm({ familySlug, copy }: CreateRootAccountFormProps) {
  const [open, setOpen] = useState(false);

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
      <form action={createRootAccountAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="familySlug" value={familySlug} />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="displayName">{copy.displayName}</Label>
          <Input id="displayName" name="displayName" required maxLength={200} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="primaryEmail">{copy.primaryEmail}</Label>
          <Input id="primaryEmail" name="primaryEmail" type="email" maxLength={320} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{copy.username}</Label>
          <Input id="username" name="username" maxLength={200} />
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
