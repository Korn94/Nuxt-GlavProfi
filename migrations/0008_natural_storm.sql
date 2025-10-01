ALTER TABLE `objects` RENAME COLUMN `document_type` TO `contract_type`;--> statement-breakpoint
ALTER TABLE `objects` MODIFY COLUMN `contract_type` varchar(20) DEFAULT 'unassigned';--> statement-breakpoint
ALTER TABLE `object_budget` ADD `work_progress` varchar(20) DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE `object_budget` ADD `act_status` varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `objects` DROP COLUMN `comment`;