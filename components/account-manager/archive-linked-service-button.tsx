"use client";

import { Archive } from "lucide-react";

import { Button } from "@/components/ui/button";
import { archiveLinkedServiceAction } from "@/lib/account-manager/actions";
import type { FamilySlug } from "@/lib/account-manager/families";

export type ArchiveLinkedServiceButtonProps = {
  familySlug: FamilySlug;
  rootAccountId: string;
  linkedServiceId: string;
  label: string;
  confirmText: string;
};

export function ArchiveLinkedServiceButton({
  familySlug,
  rootAccountId,
  linkedServiceId,
  label,
  confirmText,
}: ArchiveLinkedServiceButtonProps) {
  return (
    <form
      action={archiveLinkedServiceAction}
      onSubmit={(event) => {
        if (!confirm(confirmText)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="familySlug" value={familySlug} />
      <input type="hidden" name="rootAccountId" value={rootAccountId} />
      <input type="hidden" name="linkedServiceId" value={linkedServiceId} />
      <Button type="submit" variant="outline" size="sm">
        <Archive className="h-3.5 w-3.5" />
        {label}
      </Button>
    </form>
  );
}
