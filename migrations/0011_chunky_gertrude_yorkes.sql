CREATE TABLE `object_contracts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`object_id` bigint unsigned NOT NULL,
	`type` varchar(20) DEFAULT 'unassigned',
	`status` varchar(20) NOT NULL DEFAULT 'prepared',
	`status_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`comment` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `object_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `object_contracts` ADD CONSTRAINT `object_contracts_object_id_objects_id_fk` FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `object_idx` ON `object_contracts` (`object_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `object_contracts` (`status`);--> statement-breakpoint
ALTER TABLE `objects` DROP COLUMN `contract_type`;