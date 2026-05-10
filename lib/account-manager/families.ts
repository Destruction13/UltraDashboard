export const FAMILY_SLUGS = ["github", "google", "zoho"] as const;

export type FamilySlug = (typeof FAMILY_SLUGS)[number];

export const SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID = "vaultwarden-bridge";

export function isFamilySlug(value: string): value is FamilySlug {
  return (FAMILY_SLUGS as readonly string[]).includes(value);
}
