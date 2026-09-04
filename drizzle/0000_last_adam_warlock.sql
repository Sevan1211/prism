CREATE TABLE `sync_commits` (
	`library` text NOT NULL,
	`revision` integer NOT NULL,
	`mutation` text NOT NULL,
	`objects` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`library`, `revision`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_mutation` ON `sync_commits` (`library`,`mutation`);--> statement-breakpoint
CREATE TABLE `sync_devices` (
	`library` text NOT NULL,
	`id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created` integer NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`library`, `id`)
);
--> statement-breakpoint
CREATE TABLE `sync_libraries` (
	`id` text PRIMARY KEY NOT NULL,
	`recovery_hash` text NOT NULL,
	`head` integer DEFAULT 0 NOT NULL,
	`last_mutation` text,
	`created` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_objects` (
	`library` text NOT NULL,
	`id` text NOT NULL,
	`bytes` integer NOT NULL,
	PRIMARY KEY(`library`, `id`)
);
