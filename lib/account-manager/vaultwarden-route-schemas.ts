import { z } from "zod";

const trimmedNullableText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(4096).nullable());

const trimmedRequiredText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    return value.trim();
  }, z.string().min(1).max(max));

const trimmedOptionalText = (max: number) =>
  z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, z.string().max(max).nullable().optional());

const trimmedOptionalRequiredText = (max: number) =>
  z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    return value.trim();
  }, z.string().min(1).max(max).optional());

export const familySlugSchema = z.enum(["github", "google", "zoho"]);

export const rootAccountDraftSchema = z.object({
  family: familySlugSchema,
  displayName: trimmedRequiredText(200),
  primaryEmail: trimmedNullableText,
  username: trimmedNullableText,
});

export const linkedServiceDraftSchema = z.object({
  title: trimmedOptionalText(200).default(null),
  serviceSlug: trimmedRequiredText(64),
  serviceName: trimmedOptionalText(128).default(null),
  loginOrEmail: trimmedOptionalText(320).default(null),
  password: trimmedOptionalText(4096).default(null),
  totpSecret: trimmedOptionalText(512).default(null),
  loginUrl: trimmedOptionalText(2048).default(null),
  notes: trimmedOptionalText(8192).default(null),
});

export const createRootAccountRequestSchema = z.object({
  root: rootAccountDraftSchema,
  linkedService: linkedServiceDraftSchema,
});

export const createLinkedServiceRequestSchema = z.object({
  family: familySlugSchema,
  linkedService: linkedServiceDraftSchema,
});

export const patchLinkedServiceRequestSchema = z.object({
  title: trimmedOptionalText(200),
  serviceSlug: trimmedOptionalRequiredText(64),
  serviceName: trimmedOptionalText(128),
  loginOrEmail: trimmedOptionalText(320),
  password: trimmedOptionalText(4096),
  totpSecret: trimmedOptionalText(512),
  loginUrl: trimmedOptionalText(2048),
  notes: trimmedOptionalText(8192),
});
