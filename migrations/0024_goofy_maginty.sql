ALTER TABLE `boards` DROP FOREIGN KEY `boards_folder_id_board_folders_id_fk`;
--> statement-breakpoint
ALTER TABLE `boards` MODIFY COLUMN `folder_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `board_folders` ADD `category` varchar(20) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `boards` ADD CONSTRAINT `boards_folder_id_board_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `board_folders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `category_idx` ON `board_folders` (`category`);