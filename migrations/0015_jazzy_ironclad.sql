ALTER TABLE `price_additional_items` MODIFY COLUMN `item_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `price_categories` MODIFY COLUMN `page_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `price_item_details` MODIFY COLUMN `item_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `price_items` MODIFY COLUMN `sub_category_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `price_sub_categories` MODIFY COLUMN `category_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `price_additional_items` ADD CONSTRAINT `price_additional_items_item_id_price_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `price_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_categories` ADD CONSTRAINT `price_categories_page_id_price_pages_id_fk` FOREIGN KEY (`page_id`) REFERENCES `price_pages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_item_details` ADD CONSTRAINT `price_item_details_item_id_price_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `price_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_items` ADD CONSTRAINT `price_items_sub_category_id_price_sub_categories_id_fk` FOREIGN KEY (`sub_category_id`) REFERENCES `price_sub_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_sub_categories` ADD CONSTRAINT `price_sub_categories_category_id_price_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `price_categories`(`id`) ON DELETE cascade ON UPDATE no action;