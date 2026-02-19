ALTER TABLE `user_sessions` ADD `is_active_tab` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD `tab_id` varchar(255);--> statement-breakpoint
ALTER TABLE `user_sessions` ADD `current_path` varchar(500);--> statement-breakpoint
CREATE INDEX `active_tab_idx` ON `user_sessions` (`user_id`,`is_active_tab`);--> statement-breakpoint
CREATE INDEX `tab_id_idx` ON `user_sessions` (`tab_id`);