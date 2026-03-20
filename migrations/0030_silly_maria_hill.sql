ALTER TABLE `portfolio_case_works` RENAME COLUMN `progress` TO `value`;--> statement-breakpoint
ALTER TABLE `portfolio_case_works` MODIFY COLUMN `work_type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `portfolio_case_works` MODIFY COLUMN `value` varchar(100) NOT NULL;