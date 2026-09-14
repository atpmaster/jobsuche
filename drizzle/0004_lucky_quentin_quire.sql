CREATE TABLE `gmail_connections` (
	`session_id` text PRIMARY KEY NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gmail_sync_states` (
	`session_id` text PRIMARY KEY NOT NULL,
	`last_sync_at` text,
	`last_attempt_at` text,
	`last_error` text,
	`messages_imported` integer DEFAULT 0 NOT NULL
);
