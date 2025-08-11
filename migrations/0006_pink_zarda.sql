CREATE TABLE `portfolio_case_works` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`case_id` bigint unsigned NOT NULL,
	`work_type` varchar(50) NOT NULL,
	`progress` int NOT NULL,
	`order` int DEFAULT 0,
	CONSTRAINT `portfolio_case_works_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_cases` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`is_published` boolean DEFAULT true,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`category` varchar(50) NOT NULL,
	`address` text NOT NULL,
	`object_description` text NOT NULL,
	`short_object` text NOT NULL,
	`space` decimal NOT NULL,
	`duration` varchar(50) NOT NULL,
	`people` varchar(50) NOT NULL,
	`short_description` text NOT NULL,
	`full_description` text,
	`result` text,
	`meta_title` varchar(255),
	`meta_description` text,
	`meta_keywords` text,
	`order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolio_cases_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`case_id` bigint unsigned NOT NULL,
	`url` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`pair_group` varchar(50),
	`caption` varchar(255),
	`alt` varchar(255),
	`order` int DEFAULT 0,
	CONSTRAINT `portfolio_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `portfolio_case_works` ADD CONSTRAINT `portfolio_case_works_case_id_portfolio_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `portfolio_cases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolio_images` ADD CONSTRAINT `portfolio_images_case_id_portfolio_cases_id_fk` FOREIGN KEY (`case_id`) REFERENCES `portfolio_cases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `case_id_index` ON `portfolio_case_works` (`case_id`);--> statement-breakpoint
CREATE INDEX `slug_index` ON `portfolio_cases` (`slug`);--> statement-breakpoint
CREATE INDEX `category_index` ON `portfolio_cases` (`category`);--> statement-breakpoint
CREATE INDEX `case_id_index` ON `portfolio_images` (`case_id`);