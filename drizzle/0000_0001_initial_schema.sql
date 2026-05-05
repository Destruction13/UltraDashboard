CREATE TABLE "instruction_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"linked_service_account_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" text,
	"content_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linked_service_account_tags" (
	"linked_service_account_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "linked_service_account_tags_linked_service_account_id_tag_id_pk" PRIMARY KEY("linked_service_account_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "linked_service_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"root_account_id" uuid NOT NULL,
	"service_name" varchar(128) NOT NULL,
	"service_slug" varchar(64) NOT NULL,
	"login_or_email" varchar(320),
	"password_plaintext" text,
	"totp_secret_plaintext" text,
	"login_url" text,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "omniroute_provider_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_name" varchar(128) NOT NULL,
	"total_accounts" integer DEFAULT 0 NOT NULL,
	"active_accounts" integer DEFAULT 0 NOT NULL,
	"available_windows" integer DEFAULT 0 NOT NULL,
	"exhausted_windows" integer DEFAULT 0 NOT NULL,
	"average_remaining_pct" integer DEFAULT 0 NOT NULL,
	"display_endpoint" varchar(512),
	"source_last_snapshot_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_summary_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "omniroute_sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" varchar(32) DEFAULT 'running' NOT NULL,
	"error_message" text,
	"source_type" varchar(32) DEFAULT 'sqlite' NOT NULL,
	"stats_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "root_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_family_id" uuid NOT NULL,
	"display_name" varchar(200) NOT NULL,
	"primary_email" varchar(320),
	"username" varchar(200),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"label" varchar(128) NOT NULL,
	"color_token" varchar(32) DEFAULT 'default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instruction_documents" ADD CONSTRAINT "instruction_documents_linked_service_account_id_linked_service_accounts_id_fk" FOREIGN KEY ("linked_service_account_id") REFERENCES "public"."linked_service_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_service_account_tags" ADD CONSTRAINT "linked_service_account_tags_linked_service_account_id_linked_service_accounts_id_fk" FOREIGN KEY ("linked_service_account_id") REFERENCES "public"."linked_service_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_service_account_tags" ADD CONSTRAINT "linked_service_account_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_service_accounts" ADD CONSTRAINT "linked_service_accounts_root_account_id_root_accounts_id_fk" FOREIGN KEY ("root_account_id") REFERENCES "public"."root_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "root_accounts" ADD CONSTRAINT "root_accounts_service_family_id_service_families_id_fk" FOREIGN KEY ("service_family_id") REFERENCES "public"."service_families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "instruction_documents_lsa_key" ON "instruction_documents" USING btree ("linked_service_account_id");--> statement-breakpoint
CREATE INDEX "lsa_tags_tag_idx" ON "linked_service_account_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "linked_service_accounts_root_idx" ON "linked_service_accounts" USING btree ("root_account_id");--> statement-breakpoint
CREATE INDEX "linked_service_accounts_service_slug_idx" ON "linked_service_accounts" USING btree ("service_slug");--> statement-breakpoint
CREATE INDEX "linked_service_accounts_login_idx" ON "linked_service_accounts" USING btree ("login_or_email");--> statement-breakpoint
CREATE INDEX "orps_provider_idx" ON "omniroute_provider_snapshots" USING btree ("provider_name");--> statement-breakpoint
CREATE INDEX "orps_synced_at_idx" ON "omniroute_provider_snapshots" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX "orsr_started_at_idx" ON "omniroute_sync_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "root_accounts_family_idx" ON "root_accounts" USING btree ("service_family_id");--> statement-breakpoint
CREATE INDEX "root_accounts_display_name_idx" ON "root_accounts" USING btree ("display_name");--> statement-breakpoint
CREATE UNIQUE INDEX "service_families_slug_key" ON "service_families" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" USING btree ("slug");