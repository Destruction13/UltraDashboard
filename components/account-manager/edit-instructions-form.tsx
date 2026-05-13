"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLinkedServiceInstructionsAction } from "@/lib/account-manager/actions";
import type { FamilySlug } from "@/lib/account-manager/families";
import type { InstructionDocumentContent } from "@/lib/db/catalog";

export type EditInstructionsFormProps = {
  familySlug: FamilySlug;
  rootAccountId: string;
  linkedServiceId: string;
  initialTitle: string;
  initialSummary: string | null;
  initialContent: InstructionDocumentContent;
  copy: {
    label: string;
    title: string;
    summary: string;
    contentJson: string;
    contentJsonHint: string;
    submit: string;
    validationError: string;
  };
};

export function EditInstructionsForm({
  familySlug,
  rootAccountId,
  linkedServiceId,
  initialTitle,
  initialSummary,
  initialContent,
  copy,
}: EditInstructionsFormProps) {
  const initialJson = useMemo(() => JSON.stringify(initialContent, null, 2), [initialContent]);
  const [contentJson, setContentJson] = useState(initialJson);
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleJsonChange(value: string) {
    setContentJson(value);
    if (value.trim().length === 0) {
      setJsonError(null);
      return;
    }
    try {
      const parsed = JSON.parse(value);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        (parsed as { version?: unknown }).version !== 1 ||
        !Array.isArray((parsed as { blocks?: unknown }).blocks)
      ) {
        setJsonError(copy.validationError);
        return;
      }
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : copy.validationError);
    }
  }

  return (
    <form action={updateLinkedServiceInstructionsAction} className="flex flex-col gap-3">
      <input type="hidden" name="familySlug" value={familySlug} />
      <input type="hidden" name="rootAccountId" value={rootAccountId} />
      <input type="hidden" name="linkedServiceId" value={linkedServiceId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{copy.title}</Label>
        <Input id="title" name="title" required maxLength={200} defaultValue={initialTitle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="summary">{copy.summary}</Label>
        <Input id="summary" name="summary" maxLength={400} defaultValue={initialSummary ?? ""} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contentJson">{copy.contentJson}</Label>
        <Textarea
          id="contentJson"
          name="contentJson"
          rows={14}
          required
          value={contentJson}
          onChange={(event) => handleJsonChange(event.target.value)}
          className="font-mono text-[12px]"
        />
        <p className="text-xs text-muted-foreground">{copy.contentJsonHint}</p>
        {jsonError ? <p className="text-xs text-rose-300">{jsonError}</p> : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={Boolean(jsonError)}>
          <Save className="h-3.5 w-3.5" />
          {copy.submit}
        </Button>
      </div>
    </form>
  );
}
