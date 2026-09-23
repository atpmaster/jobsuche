CREATE TABLE `google_calendar_events` (
	`application_id` integer PRIMARY KEY NOT NULL,
	`provider_event_id` text NOT NULL,
	`web_view_link` text,
	`starts_at` text NOT NULL,
	`duration` integer DEFAULT 60 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `google_drive_folders` (
	`application_id` integer PRIMARY KEY NOT NULL,
	`provider_file_id` text NOT NULL,
	`web_view_link` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
