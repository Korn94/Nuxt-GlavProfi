ALTER TABLE `site_visitor_sessions` ADD `user_agent` text;--> statement-breakpoint
ALTER TABLE `site_visitor_sessions` ADD `is_bot` boolean DEFAULT false NOT NULL;