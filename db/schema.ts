import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const obituaries = sqliteTable("obituaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  fullName: text("full_name").notNull(),
  birthDate: text("birth_date"),
  deathDate: text("death_date"),
  serviceDate: text("service_date"),
  serviceLocation: text("service_location"),
  summary: text("summary").notNull().default(""),
  tribute: text("tribute").notNull().default(""),
  photoKey: text("photo_key"),
  photoContentType: text("photo_content_type"),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at"),
  createdByEmail: text("created_by_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_obituaries_publication").on(table.published, table.publishedAt),
]);
