import { and, desc, eq } from "drizzle-orm";
import { getD1, getDb } from ".";
import { obituaries } from "./schema";

export type Obituary = typeof obituaries.$inferSelect;

let schemaReady: Promise<void> | null = null;

export async function ensureObituarySchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = d1.batch([
      d1.prepare(`CREATE TABLE IF NOT EXISTS obituaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        birth_date TEXT,
        death_date TEXT,
        service_date TEXT,
        service_location TEXT,
        summary TEXT NOT NULL DEFAULT '',
        tribute TEXT NOT NULL DEFAULT '',
        photo_key TEXT,
        photo_content_type TEXT,
        published INTEGER NOT NULL DEFAULT 0,
        published_at TEXT,
        created_by_email TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`),
      d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_obituaries_slug ON obituaries(slug)"),
      d1.prepare("CREATE INDEX IF NOT EXISTS idx_obituaries_publication ON obituaries(published, published_at)"),
      d1.prepare("PRAGMA optimize"),
    ]).then(() => undefined).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function listPublishedObituaries() {
  await ensureObituarySchema();
  return getDb().select().from(obituaries)
    .where(eq(obituaries.published, true))
    .orderBy(desc(obituaries.publishedAt), desc(obituaries.createdAt));
}

export async function listAllObituaries() {
  await ensureObituarySchema();
  return getDb().select().from(obituaries)
    .orderBy(desc(obituaries.updatedAt), desc(obituaries.id));
}

export async function getPublishedObituary(slug: string) {
  await ensureObituarySchema();
  const [record] = await getDb().select().from(obituaries)
    .where(and(eq(obituaries.slug, slug), eq(obituaries.published, true)))
    .limit(1);
  return record ?? null;
}

export async function getObituaryById(id: number) {
  await ensureObituarySchema();
  const [record] = await getDb().select().from(obituaries)
    .where(eq(obituaries.id, id)).limit(1);
  return record ?? null;
}
