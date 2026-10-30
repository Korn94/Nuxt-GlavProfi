CREATE TABLE `partner_leads` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`lead_number` varchar(20) NOT NULL,
	`partner_id` bigint unsigned NOT NULL,
	`object_id` bigint unsigned,
	`client_name` varchar(255) NOT NULL,
	`client_phone` varchar(50) NOT NULL,
	`object_address` text,
	`object_area` decimal(10,2),
	`description` text,
	`status` varchar(30) NOT NULL DEFAULT 'new',
	`contract_amount` decimal(12,2),
	`reward_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `partner_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_leads_lead_number_unique` UNIQUE(`lead_number`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`company_name` varchar(255),
	`contact_person` varchar(255),
	`phone` varchar(255),
	`email` varchar(255),
	`comment` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partner_leads` ADD CONSTRAINT `partner_leads_partner_id_partners_id_fk` FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_leads` ADD CONSTRAINT `partner_leads_object_id_objects_id_fk` FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partners` ADD CONSTRAINT `partners_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `partner_lead_partner_idx` ON `partner_leads` (`partner_id`);--> statement-breakpoint
CREATE INDEX `partner_lead_status_idx` ON `partner_leads` (`status`);--> statement-breakpoint
CREATE INDEX `partner_lead_object_idx` ON `partner_leads` (`object_id`);--> statement-breakpoint
CREATE INDEX `partner_user_idx` ON `partners` (`user_id`);--> statement-breakpoint
CREATE INDEX `partner_active_idx` ON `partners` (`is_active`);