CREATE TABLE `work_daily_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`work_id` bigint unsigned,
	`user_id` bigint unsigned,
	`action` varchar(20) NOT NULL,
	`contractor_type` varchar(50),
	`contractor_id` int,
	`object_id` int,
	`work_date` datetime,
	`amount` decimal(10,2),
	`changes` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `work_daily_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_daily_log` ADD CONSTRAINT `work_daily_log_work_id_works_id_fk` FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_daily_log` ADD CONSTRAINT `work_daily_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `work_daily_log_work_idx` ON `work_daily_log` (`work_id`);--> statement-breakpoint
CREATE INDEX `work_daily_log_user_idx` ON `work_daily_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `work_daily_log_action_idx` ON `work_daily_log` (`action`);--> statement-breakpoint
CREATE INDEX `work_daily_log_created_at_idx` ON `work_daily_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `active_status_life_idx` ON `user_sessions` (`status`,`last_activity`);