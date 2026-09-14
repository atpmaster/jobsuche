CREATE TABLE `gmail_sync_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_sync_at` text,
	`last_attempt_at` text,
	`last_error` text,
	`messages_imported` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `application_updates` ADD `gmail_message_id` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `gmail_message_id` text;