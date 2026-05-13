import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * UltraDashboard V1 schema.
 *
 * Mirrors the entity model defined in `docs/ultradashboard-spec.md`. Field names
 * stay close to the spec. Names of indexes and constraints follow Drizzle's
 * default conventions.
 *
 * V1 trust posture: the dashboard stores secrets in plain form because the
 * product is perimeter-trusted. Do NOT log these columns. Consumers must read
 * them only through server-only data access modules.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
};

/* -------------------------------------------------------------------------- */
/*  Service families (GitHub, Google, Zoho, …)                                */
/* -------------------------------------------------------------------------- */

export const serviceFamilies = pgTable(
  "service_families",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("service_families_slug_key").on(table.slug)],
);

/* -------------------------------------------------------------------------- */
/*  Root accounts (a specific GitHub / Google / Zoho identity)                */
/* -------------------------------------------------------------------------- */

export const rootAccounts = pgTable(
  "root_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceFamilyId: uuid("service_family_id")
      .notNull()
      .references(() => serviceFamilies.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    primaryEmail: varchar("primary_email", { length: 320 }),
    username: varchar("username", { length: 200 }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("root_accounts_family_idx").on(table.serviceFamilyId),
    index("root_accounts_display_name_idx").on(table.displayName),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Linked service accounts (ChatGPT, Codex, GitHub, Devin under a root)      */
/* -------------------------------------------------------------------------- */

export const linkedServiceAccounts = pgTable(
  "linked_service_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rootAccountId: uuid("root_account_id")
      .notNull()
      .references(() => rootAccounts.id, { onDelete: "cascade" }),
    serviceName: varchar("service_name", { length: 128 }).notNull(),
    serviceSlug: varchar("service_slug", { length: 64 }).notNull(),
    loginOrEmail: varchar("login_or_email", { length: 320 }),
    /**
     * Plain-text password. Acceptable in V1 because of the perimeter trust
     * model (see spec §"Security and risk acceptance"). Never log.
     *
     * Treated as legacy fallback: when `vaultItemId` is set, the runtime
     * resolves the live password from Vaultwarden through `bw serve` instead.
     */
    passwordPlaintext: text("password_plaintext"),
    /**
     * TOTP shared secret in plain text. The current OTP is generated server
     * side. Do not return this column to clients by default.
     *
     * Treated as legacy fallback: when `vaultItemId` is set, the runtime
     * resolves the current OTP through the Vaultwarden bridge instead.
     */
    totpSecretPlaintext: text("totp_secret_plaintext"),
    /**
     * Vaultwarden item id (optional). When set, this account's live login,
     * password, and current TOTP are sourced from the localhost-only
     * `bw serve` bridge instead of the plaintext columns above.
     */
    vaultItemId: varchar("vault_item_id", { length: 64 }),
    loginUrl: text("login_url"),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    notes: text("notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("linked_service_accounts_root_idx").on(table.rootAccountId),
    index("linked_service_accounts_service_slug_idx").on(table.serviceSlug),
    index("linked_service_accounts_login_idx").on(table.loginOrEmail),
    index("linked_service_accounts_vault_item_idx").on(table.vaultItemId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Tags + linked service account tag join                                    */
/* -------------------------------------------------------------------------- */

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    label: varchar("label", { length: 128 }).notNull(),
    colorToken: varchar("color_token", { length: 32 }).notNull().default("default"),
    ...timestamps,
  },
  (table) => [uniqueIndex("tags_slug_key").on(table.slug)],
);

export const linkedServiceAccountTags = pgTable(
  "linked_service_account_tags",
  {
    linkedServiceAccountId: uuid("linked_service_account_id")
      .notNull()
      .references(() => linkedServiceAccounts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.linkedServiceAccountId, table.tagId] }),
    index("lsa_tags_tag_idx").on(table.tagId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Instruction documents (structured roadmap content per linked service)     */
/* -------------------------------------------------------------------------- */

export const instructionDocuments = pgTable(
  "instruction_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkedServiceAccountId: uuid("linked_service_account_id")
      .notNull()
      .references(() => linkedServiceAccounts.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    summary: text("summary"),
    /**
     * Structured roadmap content. Shape defined in the spec under
     * "Instruction document format". Indexed JSON allows future search.
     */
    contentJson: jsonb("content_json").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("instruction_documents_lsa_key").on(table.linkedServiceAccountId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  OmniRoute provider snapshots (normalized hourly summaries)                */
/* -------------------------------------------------------------------------- */

export const omniRouteProviderSnapshots = pgTable(
  "omniroute_provider_snapshots",
  {
    id: serial("id").primaryKey(),
    providerName: varchar("provider_name", { length: 128 }).notNull(),
    totalAccounts: integer("total_accounts").notNull().default(0),
    activeAccounts: integer("active_accounts").notNull().default(0),
    availableWindows: integer("available_windows").notNull().default(0),
    exhaustedWindows: integer("exhausted_windows").notNull().default(0),
    averageRemainingPct: integer("average_remaining_pct").notNull().default(0),
    displayEndpoint: varchar("display_endpoint", { length: 512 }),
    sourceLastSnapshotAt: timestamp("source_last_snapshot_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    rawSummaryJson: jsonb("raw_summary_json"),
  },
  (table) => [
    index("orps_provider_idx").on(table.providerName),
    index("orps_synced_at_idx").on(table.syncedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*  OmniRoute sync runs (one row per scheduled or manual sync)                */
/* -------------------------------------------------------------------------- */

export const omniRouteSyncRuns = pgTable(
  "omniroute_sync_runs",
  {
    id: serial("id").primaryKey(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull().default("running"),
    errorMessage: text("error_message"),
    sourceType: varchar("source_type", { length: 32 }).notNull().default("sqlite"),
    statsJson: jsonb("stats_json"),
  },
  (table) => [index("orsr_started_at_idx").on(table.startedAt)],
);

/* -------------------------------------------------------------------------- */
/*  Convenience type exports                                                   */
/* -------------------------------------------------------------------------- */

export type ServiceFamily = typeof serviceFamilies.$inferSelect;
export type NewServiceFamily = typeof serviceFamilies.$inferInsert;
export type RootAccount = typeof rootAccounts.$inferSelect;
export type NewRootAccount = typeof rootAccounts.$inferInsert;
export type LinkedServiceAccount = typeof linkedServiceAccounts.$inferSelect;
export type NewLinkedServiceAccount = typeof linkedServiceAccounts.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type InstructionDocument = typeof instructionDocuments.$inferSelect;
export type NewInstructionDocument = typeof instructionDocuments.$inferInsert;
export type OmniRouteProviderSnapshot = typeof omniRouteProviderSnapshots.$inferSelect;
export type NewOmniRouteProviderSnapshot = typeof omniRouteProviderSnapshots.$inferInsert;
export type OmniRouteSyncRun = typeof omniRouteSyncRuns.$inferSelect;
export type NewOmniRouteSyncRun = typeof omniRouteSyncRuns.$inferInsert;
