CREATE TABLE `user_sessions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`session_id` varchar(255) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'online',
	`last_activity` datetime DEFAULT CURRENT_TIMESTAMP,
	`started_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`ended_at` datetime,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `user_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `last_activity_idx` ON `user_sessions` (`last_activity`);