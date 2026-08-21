import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type SterlingRuntimeEnv = {
  DB?: D1Database;
  OBITUARY_MEDIA?: R2Bucket;
  OBITUARY_ADMIN_EMAILS?: string;
};

function runtimeEnv() {
  return env as unknown as SterlingRuntimeEnv;
}

export function getDb() {
  const database = runtimeEnv().DB;
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(database, { schema });
}

export function getD1() {
  const database = runtimeEnv().DB;
  if (!database) throw new Error("The obituary database is unavailable.");
  return database;
}

export function getObituaryMedia() {
  const bucket = runtimeEnv().OBITUARY_MEDIA;
  if (!bucket) throw new Error("The obituary photo store is unavailable.");
  return bucket;
}

export function getObituaryAdminEmails() {
  return runtimeEnv().OBITUARY_ADMIN_EMAILS ?? "";
}
