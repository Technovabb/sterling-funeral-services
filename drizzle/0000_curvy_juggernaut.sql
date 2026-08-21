CREATE TABLE `obituaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`full_name` text NOT NULL,
	`birth_date` text,
	`death_date` text,
	`service_date` text,
	`service_location` text,
	`summary` text DEFAULT '' NOT NULL,
	`tribute` text DEFAULT '' NOT NULL,
	`photo_key` text,
	`photo_content_type` text,
	`published` integer DEFAULT false NOT NULL,
	`published_at` text,
	`created_by_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `obituaries_slug_unique` ON `obituaries` (`slug`);