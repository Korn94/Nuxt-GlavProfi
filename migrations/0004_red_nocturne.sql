CREATE TABLE `salary_deductions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`contractor_id` int NOT NULL,
	`contractor_type` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`deduction_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`status` varchar(20) DEFAULT 'pending',
	`month` int NOT NULL,
	`year` int NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `salary_deductions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `foremans` ADD `is_on_salary` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `foremans` ADD `salary_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `foremans` ADD `salary_day` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `masters` ADD `is_on_salary` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `masters` ADD `salary_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `masters` ADD `salary_day` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `offices` ADD `is_on_salary` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `offices` ADD `salary_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `offices` ADD `salary_day` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `workers` ADD `is_on_salary` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `workers` ADD `salary_amount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `workers` ADD `salary_day` int DEFAULT 10;