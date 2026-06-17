CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`label` text DEFAULT '' NOT NULL,
	`data` text NOT NULL
);
