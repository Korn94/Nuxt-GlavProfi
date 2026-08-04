CREATE TABLE `work_agreement_acceptances` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`agreement_id` bigint unsigned NOT NULL,
	`work_id` bigint unsigned,
	`accepted_volume` decimal(12,3) NOT NULL,
	`accepted_amount` decimal(12,2) NOT NULL,
	`contractor_type` varchar(20) NOT NULL,
	`contractor_id` int NOT NULL,
	`comment` text,
	`created_by` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `work_agreement_acceptances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_agreements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`object_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`work_type` varchar(50) NOT NULL DEFAULT 'Прочее',
	`volume` decimal(12,3) NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'm2',
	`unit_custom` varchar(50),
	`price_mode` varchar(10) NOT NULL DEFAULT 'unit',
	`unit_price` decimal(12,2),
	`fixed_total` decimal(12,2),
	`agreed_amount` decimal(12,2) NOT NULL,
	`accepted_volume` decimal(12,3) NOT NULL DEFAULT '0.000',
	`accepted_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`contractor_type` varchar(20),
	`contractor_id` int,
	`foreman_id` int,
	`public_comment` text,
	`admin_comment` text,
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `work_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_agreement_acceptances` ADD CONSTRAINT `work_agreement_acceptances_agreement_id_work_agreements_id_fk` FOREIGN KEY (`agreement_id`) REFERENCES `work_agreements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_agreement_acceptances` ADD CONSTRAINT `work_agreement_acceptances_work_id_works_id_fk` FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_agreement_acceptances` ADD CONSTRAINT `work_agreement_acceptances_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_agreements` ADD CONSTRAINT `work_agreements_object_id_objects_id_fk` FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_agreements` ADD CONSTRAINT `work_agreements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_agreements` ADD CONSTRAINT `work_agreements_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `work_agreement_acceptances_agreement_idx` ON `work_agreement_acceptances` (`agreement_id`);--> statement-breakpoint
CREATE INDEX `work_agreement_acceptances_work_idx` ON `work_agreement_acceptances` (`work_id`);--> statement-breakpoint
CREATE INDEX `work_agreements_object_idx` ON `work_agreements` (`object_id`);--> statement-breakpoint
CREATE INDEX `work_agreements_contractor_idx` ON `work_agreements` (`contractor_type`,`contractor_id`);--> statement-breakpoint
CREATE INDEX `work_agreements_status_idx` ON `work_agreements` (`status`);