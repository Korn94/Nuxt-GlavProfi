ALTER TABLE `expenses` MODIFY COLUMN `contractor_id` int;--> statement-breakpoint
ALTER TABLE `expenses` MODIFY COLUMN `contractor_type` varchar(50);--> statement-breakpoint
ALTER TABLE `expenses` ADD `expense_type` varchar(50) DEFAULT 'Работа';