CREATE TABLE `application_merges` (
	`source_id` integer PRIMARY KEY NOT NULL,
	`target_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`application_id` integer NOT NULL,
	`starts_at` text NOT NULL,
	`duration` integer DEFAULT 60 NOT NULL,
	`location` text,
	`notes` text
);
