CREATE TABLE `board_columns` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`board_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `board_columns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boards_tasks` ADD `column_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `board_columns` ADD CONSTRAINT `board_columns_board_id_boards_id_fk` FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `board_columns_board_idx` ON `board_columns` (`board_id`);--> statement-breakpoint
CREATE INDEX `board_columns_order_idx` ON `board_columns` (`board_id`,`order`);--> statement-breakpoint
ALTER TABLE `boards_tasks` ADD CONSTRAINT `boards_tasks_column_id_board_columns_id_fk` FOREIGN KEY (`column_id`) REFERENCES `board_columns`(`id`) ON DELETE set null ON UPDATE no action;