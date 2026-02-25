CREATE TABLE `board_folders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`created_by` bigint unsigned NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `board_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boards` ADD `folder_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `boards` ADD `order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `board_folders` ADD CONSTRAINT `board_folders_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_idx` ON `board_folders` (`order`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `board_folders` (`name`);--> statement-breakpoint
ALTER TABLE `boards` ADD CONSTRAINT `boards_folder_id_board_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `board_folders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `folder_idx` ON `boards` (`folder_id`);--> statement-breakpoint
CREATE INDEX `board_order_idx` ON `boards` (`folder_id`,`order`);