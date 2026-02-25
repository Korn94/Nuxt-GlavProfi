ALTER TABLE `boards` DROP FOREIGN KEY `boards_folder_id_board_folders_id_fk`;
--> statement-breakpoint
DROP INDEX `category_idx` ON `board_folders`;--> statement-breakpoint
ALTER TABLE `boards` MODIFY COLUMN `folder_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `boards` ADD CONSTRAINT `boards_folder_id_board_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `board_folders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `board_folders` DROP COLUMN `category`;