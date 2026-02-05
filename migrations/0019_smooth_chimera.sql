CREATE TABLE `boards` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(20) NOT NULL DEFAULT 'general',
	`object_id` bigint unsigned,
	`created_by` bigint unsigned NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_activity_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`task_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`action` varchar(50) NOT NULL,
	`changes` text,
	`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_attachments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`task_id` bigint unsigned NOT NULL,
	`file_url` varchar(500) NOT NULL,
	`file_type` varchar(20) NOT NULL DEFAULT 'other',
	`file_name` varchar(255) NOT NULL,
	`file_size` bigint unsigned NOT NULL DEFAULT 0,
	`uploaded_by` bigint unsigned NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_comments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`task_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`comment` text NOT NULL,
	`parent_id` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_subtasks` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`task_id` bigint unsigned NOT NULL,
	`parent_id` bigint unsigned,
	`title` varchar(255) NOT NULL,
	`description` text,
	`is_completed` boolean NOT NULL DEFAULT false,
	`completed_at` datetime,
	`order` int NOT NULL DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_subtasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#6c757d',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_tasks` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`board_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(20) NOT NULL DEFAULT 'todo',
	`priority` varchar(20) NOT NULL DEFAULT 'medium',
	`assigned_to` bigint unsigned,
	`due_date` datetime,
	`completed_date` datetime,
	`order` int NOT NULL DEFAULT 0,
	`created_by` bigint unsigned NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `boards_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boards_tasks_tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`task_id` bigint unsigned NOT NULL,
	`tag_id` bigint unsigned NOT NULL,
	CONSTRAINT `boards_tasks_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `boards` ADD CONSTRAINT `boards_object_id_objects_id_fk` FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards` ADD CONSTRAINT `boards_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_activity_log` ADD CONSTRAINT `boards_activity_log_task_id_boards_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `boards_tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_activity_log` ADD CONSTRAINT `boards_activity_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_attachments` ADD CONSTRAINT `boards_attachments_task_id_boards_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `boards_tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_attachments` ADD CONSTRAINT `boards_attachments_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_comments` ADD CONSTRAINT `boards_comments_task_id_boards_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `boards_tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_comments` ADD CONSTRAINT `boards_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_comments` ADD CONSTRAINT `boards_comments_parent_id_boards_comments_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `boards_comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_subtasks` ADD CONSTRAINT `boards_subtasks_task_id_boards_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `boards_tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_subtasks` ADD CONSTRAINT `boards_subtasks_parent_id_boards_subtasks_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `boards_subtasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_tasks` ADD CONSTRAINT `boards_tasks_board_id_boards_id_fk` FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_tasks` ADD CONSTRAINT `boards_tasks_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_tasks` ADD CONSTRAINT `boards_tasks_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_tasks_tags` ADD CONSTRAINT `boards_tasks_tags_task_id_boards_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `boards_tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boards_tasks_tags` ADD CONSTRAINT `boards_tasks_tags_tag_id_boards_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `boards_tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `type_idx` ON `boards` (`type`);--> statement-breakpoint
CREATE INDEX `object_idx` ON `boards` (`object_id`);--> statement-breakpoint
CREATE INDEX `activity_task_idx` ON `boards_activity_log` (`task_id`);--> statement-breakpoint
CREATE INDEX `activity_user_idx` ON `boards_activity_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_action_idx` ON `boards_activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `activity_timestamp_idx` ON `boards_activity_log` (`timestamp`);--> statement-breakpoint
CREATE INDEX `attachment_task_idx` ON `boards_attachments` (`task_id`);--> statement-breakpoint
CREATE INDEX `attachment_type_idx` ON `boards_attachments` (`file_type`);--> statement-breakpoint
CREATE INDEX `comment_task_idx` ON `boards_comments` (`task_id`);--> statement-breakpoint
CREATE INDEX `comment_user_idx` ON `boards_comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `comment_parent_idx` ON `boards_comments` (`parent_id`);--> statement-breakpoint
CREATE INDEX `task_idx` ON `boards_subtasks` (`task_id`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `boards_subtasks` (`parent_id`);--> statement-breakpoint
CREATE INDEX `completed_idx` ON `boards_subtasks` (`is_completed`);--> statement-breakpoint
CREATE INDEX `subtask_order_idx` ON `boards_subtasks` (`task_id`,`parent_id`,`order`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `boards_tags` (`name`);--> statement-breakpoint
CREATE INDEX `board_idx` ON `boards_tasks` (`board_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `boards_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `boards_tasks` (`priority`);--> statement-breakpoint
CREATE INDEX `assigned_idx` ON `boards_tasks` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `boards_tasks` (`board_id`,`order`);--> statement-breakpoint
CREATE INDEX `task_tag_idx` ON `boards_tasks_tags` (`task_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `boards_tasks_tags` (`tag_id`);