ALTER TABLE `work_agreements` MODIFY COLUMN `volume` decimal(12,3);--> statement-breakpoint
ALTER TABLE `work_agreements` ADD `unit_price_only` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `work_agreements` ADD `parent_agreement_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `work_agreements` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `work_agreements` ADD CONSTRAINT `work_agreements_parent_agreement_id_work_agreements_id_fk` FOREIGN KEY (`parent_agreement_id`) REFERENCES `work_agreements`(`id`) ON DELETE set null ON UPDATE no action;