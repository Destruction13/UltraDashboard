"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { FAMILY_SLUGS, type FamilySlug } from "@/lib/account-manager/families";
import {
  archiveLinkedServiceAccount,
  archiveRootAccount,
  createLinkedServiceAccount,
  createRootAccount,
  deleteLinkedServiceAccount,
  setTagsForLinkedService,
  updateLinkedServiceAccount,
  updateLinkedServiceNotes,
  upsertInstructionDocument,
} from "@/lib/account-manager/repository";
import type { InstructionDocumentContent } from "@/lib/db/catalog";

const familyEnum = z.enum(FAMILY_SLUGS);

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string): string | null {
  const value = readString(formData, key);
  return value.length === 0 ? null : value;
}

const createRootSchema = z.object({
  familySlug: familyEnum,
  displayName: z.string().min(1),
  primaryEmail: z.string().email().nullable().optional(),
  username: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function createRootAccountAction(formData: FormData) {
  const parsed = createRootSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    displayName: readString(formData, "displayName"),
    primaryEmail: readOptionalString(formData, "primaryEmail"),
    username: readOptionalString(formData, "username"),
    notes: readOptionalString(formData, "notes"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid root account input: ${parsed.error.message}`);
  }

  const row = await createRootAccount(parsed.data);
  revalidatePath(`/account-manager/${parsed.data.familySlug}`);
  redirect(`/account-manager/${parsed.data.familySlug}/${row.id}`);
}

const archiveRootSchema = z.object({
  familySlug: familyEnum,
  rootAccountId: z.string().uuid(),
});

export async function archiveRootAccountAction(formData: FormData) {
  const parsed = archiveRootSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid archive request: ${parsed.error.message}`);
  }
  await archiveRootAccount(parsed.data.rootAccountId);
  revalidatePath(`/account-manager/${parsed.data.familySlug}`);
  redirect(`/account-manager/${parsed.data.familySlug}`);
}

const tagSlugRegex = /[a-zA-Z0-9_\-]+/g;

const createLinkedSchema = z.object({
  familySlug: familyEnum,
  rootAccountId: z.string().uuid(),
  serviceName: z.string().min(1),
  serviceSlug: z.string().min(1),
  loginOrEmail: z.string().nullable().optional(),
  loginUrl: z.string().url().nullable().optional(),
  vaultItemId: z.string().nullable().optional(),
  passwordPlaintext: z.string().nullable().optional(),
  totpSecretPlaintext: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tagSlugs: z.string().nullable().optional(),
});

export async function createLinkedServiceAction(formData: FormData) {
  const parsed = createLinkedSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
    serviceName: readString(formData, "serviceName"),
    serviceSlug: readString(formData, "serviceSlug"),
    loginOrEmail: readOptionalString(formData, "loginOrEmail"),
    loginUrl: readOptionalString(formData, "loginUrl"),
    vaultItemId: readOptionalString(formData, "vaultItemId"),
    passwordPlaintext: readOptionalString(formData, "passwordPlaintext"),
    totpSecretPlaintext: readOptionalString(formData, "totpSecretPlaintext"),
    notes: readOptionalString(formData, "notes"),
    tagSlugs: readOptionalString(formData, "tagSlugs"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid linked service input: ${parsed.error.message}`);
  }

  const tagSlugs = parsed.data.tagSlugs
    ? Array.from(parsed.data.tagSlugs.match(tagSlugRegex) ?? [])
    : [];

  const row = await createLinkedServiceAccount({
    rootAccountId: parsed.data.rootAccountId,
    serviceName: parsed.data.serviceName,
    serviceSlug: parsed.data.serviceSlug,
    loginOrEmail: parsed.data.loginOrEmail,
    loginUrl: parsed.data.loginUrl,
    vaultItemId: parsed.data.vaultItemId,
    passwordPlaintext: parsed.data.passwordPlaintext,
    totpSecretPlaintext: parsed.data.totpSecretPlaintext,
    notes: parsed.data.notes,
    tagSlugs,
  });

  const family = parsed.data.familySlug satisfies FamilySlug;
  revalidatePath(`/account-manager/${family}`);
  revalidatePath(`/account-manager/${family}/${parsed.data.rootAccountId}`);
  redirect(
    `/account-manager/${family}/${parsed.data.rootAccountId}/services/${row.id}`,
  );
}

const updateLinkedSchema = z.object({
  familySlug: familyEnum,
  rootAccountId: z.string().uuid(),
  linkedServiceId: z.string().uuid(),
  serviceName: z.string().min(1),
  serviceSlug: z.string().min(1),
  loginOrEmail: z.string().nullable().optional(),
  loginUrl: z.string().url().nullable().optional(),
  vaultItemId: z.string().nullable().optional(),
  passwordPlaintext: z.string().nullable().optional(),
  totpSecretPlaintext: z.string().nullable().optional(),
  tagSlugs: z.string().nullable().optional(),
});

export async function updateLinkedServiceAction(formData: FormData) {
  const parsed = updateLinkedSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
    linkedServiceId: readString(formData, "linkedServiceId"),
    serviceName: readString(formData, "serviceName"),
    serviceSlug: readString(formData, "serviceSlug"),
    loginOrEmail: readOptionalString(formData, "loginOrEmail"),
    loginUrl: readOptionalString(formData, "loginUrl"),
    vaultItemId: readOptionalString(formData, "vaultItemId"),
    passwordPlaintext: readOptionalString(formData, "passwordPlaintext"),
    totpSecretPlaintext: readOptionalString(formData, "totpSecretPlaintext"),
    tagSlugs: readOptionalString(formData, "tagSlugs"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid linked service update: ${parsed.error.message}`);
  }

  await updateLinkedServiceAccount(parsed.data.linkedServiceId, {
    serviceName: parsed.data.serviceName,
    serviceSlug: parsed.data.serviceSlug,
    loginOrEmail: parsed.data.loginOrEmail ?? null,
    loginUrl: parsed.data.loginUrl ?? null,
    vaultItemId: parsed.data.vaultItemId ?? null,
    passwordPlaintext: parsed.data.passwordPlaintext ?? null,
    totpSecretPlaintext: parsed.data.totpSecretPlaintext ?? null,
  });

  if (parsed.data.tagSlugs !== undefined) {
    const tagSlugs = parsed.data.tagSlugs
      ? Array.from(parsed.data.tagSlugs.match(tagSlugRegex) ?? [])
      : [];
    await setTagsForLinkedService(parsed.data.linkedServiceId, tagSlugs);
  }

  const family = parsed.data.familySlug satisfies FamilySlug;
  revalidatePath(`/account-manager/${family}`);
  revalidatePath(`/account-manager/${family}/${parsed.data.rootAccountId}`);
  revalidatePath(
    `/account-manager/${family}/${parsed.data.rootAccountId}/services/${parsed.data.linkedServiceId}`,
  );
}

const updateNotesSchema = z.object({
  familySlug: familyEnum,
  rootAccountId: z.string().uuid(),
  linkedServiceId: z.string().uuid(),
  notes: z.string().nullable().optional(),
});

export async function updateLinkedServiceNotesAction(formData: FormData) {
  const parsed = updateNotesSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
    linkedServiceId: readString(formData, "linkedServiceId"),
    notes: readOptionalString(formData, "notes"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid notes update: ${parsed.error.message}`);
  }

  await updateLinkedServiceNotes(parsed.data.linkedServiceId, parsed.data.notes ?? null);
  const family = parsed.data.familySlug satisfies FamilySlug;
  revalidatePath(
    `/account-manager/${family}/${parsed.data.rootAccountId}/services/${parsed.data.linkedServiceId}`,
  );
}

const instructionContentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(z.unknown()).min(1),
});

const updateInstructionsSchema = z.object({
  familySlug: familyEnum,
  rootAccountId: z.string().uuid(),
  linkedServiceId: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  contentJson: z.string().min(2),
});

export async function updateLinkedServiceInstructionsAction(formData: FormData) {
  const parsed = updateInstructionsSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
    linkedServiceId: readString(formData, "linkedServiceId"),
    title: readString(formData, "title"),
    summary: readOptionalString(formData, "summary"),
    contentJson: readString(formData, "contentJson"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid instruction update: ${parsed.error.message}`);
  }

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(parsed.data.contentJson);
  } catch (error) {
    throw new Error(
      `Instruction content_json must be valid JSON: ${error instanceof Error ? error.message : "parse error"}`,
    );
  }
  const validated = instructionContentSchema.safeParse(parsedContent);
  if (!validated.success) {
    throw new Error(
      "Instruction content_json must match { version: 1, blocks: [...] } as defined in the spec.",
    );
  }

  await upsertInstructionDocument({
    linkedServiceAccountId: parsed.data.linkedServiceId,
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    contentJson: parsedContent as InstructionDocumentContent,
  });

  const family = parsed.data.familySlug satisfies FamilySlug;
  revalidatePath(
    `/account-manager/${family}/${parsed.data.rootAccountId}/services/${parsed.data.linkedServiceId}`,
  );
}

const archiveLinkedSchema = z.object({
  familySlug: familyEnum,
  rootAccountId: z.string().uuid(),
  linkedServiceId: z.string().uuid(),
});

export async function archiveLinkedServiceAction(formData: FormData) {
  const parsed = archiveLinkedSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
    linkedServiceId: readString(formData, "linkedServiceId"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid archive request: ${parsed.error.message}`);
  }

  await archiveLinkedServiceAccount(parsed.data.linkedServiceId);
  const family = parsed.data.familySlug satisfies FamilySlug;
  revalidatePath(`/account-manager/${family}/${parsed.data.rootAccountId}`);
  redirect(`/account-manager/${family}/${parsed.data.rootAccountId}`);
}

export async function deleteLinkedServiceAction(formData: FormData) {
  const parsed = archiveLinkedSchema.safeParse({
    familySlug: readString(formData, "familySlug"),
    rootAccountId: readString(formData, "rootAccountId"),
    linkedServiceId: readString(formData, "linkedServiceId"),
  });
  if (!parsed.success) {
    throw new Error(`Invalid delete request: ${parsed.error.message}`);
  }

  await deleteLinkedServiceAccount(parsed.data.linkedServiceId);
  const family = parsed.data.familySlug satisfies FamilySlug;
  revalidatePath(`/account-manager/${family}/${parsed.data.rootAccountId}`);
  redirect(`/account-manager/${family}/${parsed.data.rootAccountId}`);
}
