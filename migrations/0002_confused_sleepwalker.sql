ALTER TABLE `price_additional_items` MODIFY COLUMN `label` varchar(255);--> statement-breakpoint
ALTER TABLE `price_items` MODIFY COLUMN `price` decimal(10,2) NOT NULL;