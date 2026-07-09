CREATE TABLE `permissions_pages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`parent_id` bigint unsigned,
	`order` int NOT NULL DEFAULT 0,
	`has_create` boolean NOT NULL DEFAULT false,
	`has_edit` boolean NOT NULL DEFAULT false,
	`has_delete` boolean NOT NULL DEFAULT false,
	`has_special` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `permissions_role_access` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`role` varchar(50) NOT NULL,
	`page_slug` varchar(50) NOT NULL,
	`can_view` boolean NOT NULL DEFAULT false,
	`can_create` boolean NOT NULL DEFAULT false,
	`can_edit` boolean NOT NULL DEFAULT false,
	`can_delete` boolean NOT NULL DEFAULT false,
	`can_special` boolean NOT NULL DEFAULT false,
	`comment` text,
	`updated_by` bigint unsigned,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_role_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions_user_overrides` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`page_slug` varchar(50) NOT NULL,
	`can_view` boolean,
	`can_create` boolean,
	`can_edit` boolean,
	`can_delete` boolean,
	`can_special` boolean,
	`reason` text,
	`expires_at` datetime,
	`created_by` bigint unsigned,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_user_overrides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `masters` RENAME COLUMN `userId` TO `user_id`;--> statement-breakpoint
ALTER TABLE `offices` RENAME COLUMN `userId` TO `user_id`;--> statement-breakpoint
ALTER TABLE `workers` RENAME COLUMN `userId` TO `user_id`;--> statement-breakpoint
ALTER TABLE `foremans` DROP FOREIGN KEY `foremans_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `masters` DROP FOREIGN KEY `masters_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `offices` DROP FOREIGN KEY `offices_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `workers` DROP FOREIGN KEY `workers_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `foremans` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `masters` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `offices` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `workers` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `foremans` ADD `user_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `foremans` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `masters` ADD `daily_rate` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `masters` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `offices` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_blocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `last_seen_at` datetime;--> statement-breakpoint
ALTER TABLE `workers` ADD `daily_rate` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `workers` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `works` ADD `work_source` varchar(20) DEFAULT 'volume' NOT NULL;--> statement-breakpoint
ALTER TABLE `permissions_pages` ADD CONSTRAINT `permissions_pages_parent_id_permissions_pages_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `permissions_pages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions_role_access` ADD CONSTRAINT `permissions_role_access_page_slug_permissions_pages_slug_fk` FOREIGN KEY (`page_slug`) REFERENCES `permissions_pages`(`slug`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions_role_access` ADD CONSTRAINT `permissions_role_access_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions_user_overrides` ADD CONSTRAINT `permissions_user_overrides_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions_user_overrides` ADD CONSTRAINT `permissions_user_overrides_page_slug_permissions_pages_slug_fk` FOREIGN KEY (`page_slug`) REFERENCES `permissions_pages`(`slug`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions_user_overrides` ADD CONSTRAINT `permissions_user_overrides_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `permissions_pages_slug_idx` ON `permissions_pages` (`slug`);--> statement-breakpoint
CREATE INDEX `permissions_pages_parent_idx` ON `permissions_pages` (`parent_id`);--> statement-breakpoint
CREATE INDEX `permissions_pages_order_idx` ON `permissions_pages` (`order`);--> statement-breakpoint
CREATE INDEX `permissions_pages_active_idx` ON `permissions_pages` (`is_active`);--> statement-breakpoint
CREATE INDEX `permissions_role_access_role_idx` ON `permissions_role_access` (`role`);--> statement-breakpoint
CREATE INDEX `permissions_role_access_page_idx` ON `permissions_role_access` (`page_slug`);--> statement-breakpoint
CREATE INDEX `permissions_role_access_unique_idx` ON `permissions_role_access` (`role`,`page_slug`);--> statement-breakpoint
CREATE INDEX `permissions_role_access_active_idx` ON `permissions_role_access` (`is_active`);--> statement-breakpoint
CREATE INDEX `permissions_user_overrides_user_idx` ON `permissions_user_overrides` (`user_id`);--> statement-breakpoint
CREATE INDEX `permissions_user_overrides_page_idx` ON `permissions_user_overrides` (`page_slug`);--> statement-breakpoint
CREATE INDEX `permissions_user_overrides_unique_idx` ON `permissions_user_overrides` (`user_id`,`page_slug`);--> statement-breakpoint
CREATE INDEX `permissions_user_overrides_expires_idx` ON `permissions_user_overrides` (`expires_at`);--> statement-breakpoint
CREATE INDEX `permissions_user_overrides_active_idx` ON `permissions_user_overrides` (`is_active`);--> statement-breakpoint
ALTER TABLE `foremans` ADD CONSTRAINT `foremans_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masters` ADD CONSTRAINT `masters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workers` ADD CONSTRAINT `workers_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `users_blocked_idx` ON `users` (`is_blocked`);--> statement-breakpoint
CREATE INDEX `users_last_seen_idx` ON `users` (`last_seen_at`);--> statement-breakpoint
ALTER TABLE `foremans` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `foremans` DROP COLUMN `is_on_salary`;--> statement-breakpoint
ALTER TABLE `foremans` DROP COLUMN `salary_amount`;--> statement-breakpoint
ALTER TABLE `foremans` DROP COLUMN `salary_day`;--> statement-breakpoint
ALTER TABLE `masters` DROP COLUMN `is_on_salary`;--> statement-breakpoint
ALTER TABLE `masters` DROP COLUMN `salary_amount`;--> statement-breakpoint
ALTER TABLE `masters` DROP COLUMN `salary_day`;--> statement-breakpoint
ALTER TABLE `offices` DROP COLUMN `is_on_salary`;--> statement-breakpoint
ALTER TABLE `offices` DROP COLUMN `salary_amount`;--> statement-breakpoint
ALTER TABLE `offices` DROP COLUMN `salary_day`;--> statement-breakpoint
ALTER TABLE `workers` DROP COLUMN `is_no_name`;--> statement-breakpoint
ALTER TABLE `workers` DROP COLUMN `works`;--> statement-breakpoint
ALTER TABLE `workers` DROP COLUMN `is_on_salary`;--> statement-breakpoint
ALTER TABLE `workers` DROP COLUMN `salary_amount`;--> statement-breakpoint
ALTER TABLE `workers` DROP COLUMN `salary_day`;