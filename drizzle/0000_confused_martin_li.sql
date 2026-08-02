CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`track` text DEFAULT 'other' NOT NULL,
	`location` text,
	`score` integer DEFAULT 50 NOT NULL,
	`status` text DEFAULT 'saved' NOT NULL,
	`deadline` text,
	`url` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'Kariyer' NOT NULL,
	`estimate` text DEFAULT '30 dk' NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
