CREATE TABLE `admin_sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`salt` text NOT NULL,
	`password` text NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tests` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`started` integer NOT NULL,
	`deadline` integer NOT NULL,
	`events` text NOT NULL,
	`progress` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`synced` integer NOT NULL,
	`delayed` integer DEFAULT 0 NOT NULL
);
