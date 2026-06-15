CREATE TABLE `galleries` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `galleries_slug_unique` ON `galleries` (`slug`);--> statement-breakpoint
CREATE TABLE `photo_galleries` (
	`photo_id` text NOT NULL,
	`gallery_id` text NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`photo_id`, `gallery_id`),
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gallery_id`) REFERENCES `galleries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`body_text` text,
	`alt` text,
	`month` text,
	`show_exif` integer DEFAULT false NOT NULL,
	`exif_json` text,
	`width` integer,
	`height` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `site_texts` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
