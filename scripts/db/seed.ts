/**
 * Idempotent seed for UltraDashboard V1.
 *
 * Loads the canonical service families (`GitHub`, `Google`, `Zoho`) and a
 * starter set of tags. Also logs the first-wave linked service catalog
 * (`ChatGPT`, `Codex`, `GitHub`, `Devin`) so operators can confirm the catalog
 * the AccountManager flows will use when attaching services to roots.
 *
 * Safe to run repeatedly. Does NOT seed any real account credentials.
 *
 * Usage:
 *   npm run db:seed
 */
import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { FAMILY_SEEDS, LINKED_SERVICE_CATALOG } from "@/lib/db/catalog";
import * as schema from "@/lib/db/schema";

type TagSeed = {
  slug: string;
  label: string;
  colorToken: "default" | "violet" | "amber" | "emerald" | "rose" | "sky";
};

const TAG_SEEDS: ReadonlyArray<TagSeed> = [
  { slug: "primary", label: "Primary", colorToken: "violet" },
  { slug: "secondary", label: "Secondary", colorToken: "default" },
  { slug: "agent", label: "Agent", colorToken: "sky" },
  { slug: "automation", label: "Automation", colorToken: "emerald" },
  { slug: "billing", label: "Billing", colorToken: "amber" },
  { slug: "rotate-soon", label: "Rotate soon", colorToken: "rose" },
];

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the seed.");
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle({ client: pool, schema });

  try {
    console.log("[db:seed] upserting service families");
    for (const family of FAMILY_SEEDS) {
      await db
        .insert(schema.serviceFamilies)
        .values({
          slug: family.slug,
          name: family.name,
          description: family.description,
          sortOrder: family.sortOrder,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: schema.serviceFamilies.slug,
          set: {
            name: family.name,
            description: family.description,
            sortOrder: family.sortOrder,
            isActive: true,
            updatedAt: new Date(),
          },
        });
    }

    console.log("[db:seed] upserting tags");
    for (const tag of TAG_SEEDS) {
      await db
        .insert(schema.tags)
        .values({ slug: tag.slug, label: tag.label, colorToken: tag.colorToken })
        .onConflictDoUpdate({
          target: schema.tags.slug,
          set: { label: tag.label, colorToken: tag.colorToken, updatedAt: new Date() },
        });
    }

    console.log(
      "[db:seed] linked service catalog (reference shape, not persisted as templates):",
    );
    for (const entry of LINKED_SERVICE_CATALOG) {
      console.log(`  - ${entry.serviceName} (${entry.slug}) → ${entry.defaultLoginUrl}`);
    }

    console.log("[db:seed] done");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[db:seed] failed:", error);
  process.exitCode = 1;
});
