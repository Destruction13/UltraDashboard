"use client";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLinkedServiceNotesAction } from "@/lib/account-manager/actions";
import type { FamilySlug } from "@/lib/account-manager/families";

export type EditNotesFormProps = {
  familySlug: FamilySlug;
  rootAccountId: string;
  linkedServiceId: string;
  initialNotes: string | null;
  copy: {
    label: string;
    placeholder: string;
    submit: string;
  };
};

export function EditNotesForm({
  familySlug,
  rootAccountId,
  linkedServiceId,
  initialNotes,
  copy,
}: EditNotesFormProps) {
  return (
    <form action={updateLinkedServiceNotesAction} className="flex flex-col gap-3">
      <input type="hidden" name="familySlug" value={familySlug} />
      <input type="hidden" name="rootAccountId" value={rootAccountId} />
      <input type="hidden" name="linkedServiceId" value={linkedServiceId} />
      <Label htmlFor="notes">{copy.label}</Label>
      <Textarea
        id="notes"
        name="notes"
        defaultValue={initialNotes ?? ""}
        placeholder={copy.placeholder}
        rows={5}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          <Save className="h-3.5 w-3.5" />
          {copy.submit}
        </Button>
      </div>
    </form>
  );
}
