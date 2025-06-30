CREATE TABLE `agreements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`date` datetime DEFAULT CURRENT_TIMESTAMP,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`master_id` int,
	`worker_id` int,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`comment` text,
	`payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`operation_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`object_id` int NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `comings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`comment` text,
	`contractor_id` int NOT NULL,
	`contractor_type` varchar(50) NOT NULL,
	`payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`operation_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`object_id` int,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `foreman_profit_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`work_id` int NOT NULL,
	`object_id` int NOT NULL,
	`foreman_id` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `foreman_profit_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `foremans` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(255),
	`comment` text,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`userId` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `foremans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masters` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(255),
	`comment` text,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`userId` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `masters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`name` varchar(255) NOT NULL,
	`comment` text,
	`object_id` int NOT NULL,
	`has_receipt` boolean DEFAULT false,
	`type` varchar(50) NOT NULL DEFAULT 'incoming',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `objects` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`total_works` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total_income` decimal(10,2) NOT NULL DEFAULT '0.00',
	`profit` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`foreman_id` int,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `objects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(255),
	`comment` text,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`userId` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `offices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_additional_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`item_id` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`dopwork` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `price_additional_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`page_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `price_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_item_details` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`item_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `price_item_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`sub_category_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `price_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_pages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`meta_title` varchar(255),
	`meta_description` text,
	`meta_keywords` text,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `price_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `price_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `price_sub_categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `price_sub_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`telegram_id` int,
	`login` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'worker',
	`contractor_type` varchar(50),
	`contractor_id` int,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_telegram_id_unique` UNIQUE(`telegram_id`),
	CONSTRAINT `users_login_unique` UNIQUE(`login`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(255),
	`comment` text,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`is_no_name` boolean DEFAULT false,
	`works` text,
	`userId` bigint unsigned,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `works` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`worker_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`profit` decimal(10,2) NOT NULL DEFAULT '0.00',
	`comment` text,
	`contractor_id` int NOT NULL,
	`contractor_type` varchar(50) NOT NULL,
	`work_types` varchar(50) DEFAULT 'Прочее',
	`foreman_id` int,
	`accepted` boolean DEFAULT false,
	`accepted_date` datetime,
	`rejected_reason` text,
	`foreman_profit` decimal(10,2) DEFAULT '0.00',
	`paid` boolean DEFAULT false,
	`payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`operation_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`object_id` int NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `works_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `foremans` ADD CONSTRAINT `foremans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masters` ADD CONSTRAINT `masters_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offices` ADD CONSTRAINT `offices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workers` ADD CONSTRAINT `workers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;