CREATE TABLE `object_acts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`object_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`comment` text,
	`status` varchar(20) NOT NULL DEFAULT 'prepared',
	`status_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `object_acts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `object_acts` ADD CONSTRAINT `object_acts_object_id_objects_id_fk` FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `object_idx` ON `object_acts` (`object_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `object_acts` (`status`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `object_acts` (`object_id`,`order`);