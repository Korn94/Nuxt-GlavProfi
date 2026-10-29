CREATE TABLE `site_visitor_events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`session_id` varchar(32) NOT NULL,
	`visitor_id` varchar(64) NOT NULL,
	`type` varchar(40) NOT NULL,
	`path` varchar(300),
	`meta` json,
	`created_at` datetime NOT NULL,
	CONSTRAINT `site_visitor_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_visitor_pageviews` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`session_id` varchar(32) NOT NULL,
	`visitor_id` varchar(64) NOT NULL,
	`path` varchar(300) NOT NULL,
	`entered_at` datetime NOT NULL,
	`duration_sec` int NOT NULL DEFAULT 0,
	`max_scroll_pct` int NOT NULL DEFAULT 0,
	CONSTRAINT `site_visitor_pageviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_visitor_sessions` (
	`id` varchar(32) NOT NULL,
	`visitor_id` varchar(64) NOT NULL,
	`visit_number` int NOT NULL DEFAULT 1,
	`started_at` datetime NOT NULL,
	`last_activity_at` datetime NOT NULL,
	`ended_at` datetime,
	`active_seconds` int NOT NULL DEFAULT 0,
	`pages_count` int NOT NULL DEFAULT 0,
	`events_count` int NOT NULL DEFAULT 0,
	`is_bounce` boolean NOT NULL DEFAULT false,
	`converted` boolean NOT NULL DEFAULT false,
	`landing_path` varchar(300),
	`exit_path` varchar(300),
	`referrer_host` varchar(255),
	`referrer_type` varchar(20) NOT NULL DEFAULT 'direct',
	`channel` varchar(30) NOT NULL DEFAULT 'direct',
	`utm_source` varchar(100),
	`utm_medium` varchar(100),
	`utm_campaign` varchar(255),
	`utm_term` varchar(255),
	`utm_content` varchar(255),
	`yclid` varchar(100),
	`gclid` varchar(150),
	`ip_hash` varchar(64),
	`country` varchar(60),
	`region` varchar(100),
	`city` varchar(100),
	`device_type` varchar(20) NOT NULL DEFAULT 'unknown',
	`os` varchar(30),
	`browser` varchar(40),
	`screen_w` int,
	`screen_h` int,
	`viewport_w` int,
	`viewport_h` int,
	`language` varchar(20),
	`timezone` varchar(64),
	CONSTRAINT `site_visitor_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_visitors` (
	`id` varchar(64) NOT NULL,
	`first_seen_at` datetime NOT NULL,
	`last_seen_at` datetime NOT NULL,
	`visits_count` int NOT NULL DEFAULT 1,
	`first_channel` varchar(30),
	`first_referrer_host` varchar(255),
	`first_utm_source` varchar(100),
	`first_utm_medium` varchar(100),
	`first_utm_campaign` varchar(255),
	`first_landing_path` varchar(300),
	`ym_client_id` varchar(64),
	`has_converted` boolean NOT NULL DEFAULT false,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `site_visitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sve_session_idx` ON `site_visitor_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `sve_type_created_idx` ON `site_visitor_events` (`type`,`created_at`);--> statement-breakpoint
CREATE INDEX `sve_visitor_idx` ON `site_visitor_events` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `svp_session_idx` ON `site_visitor_pageviews` (`session_id`,`entered_at`);--> statement-breakpoint
CREATE INDEX `svp_path_entered_idx` ON `site_visitor_pageviews` (`path`,`entered_at`);--> statement-breakpoint
CREATE INDEX `svp_entered_idx` ON `site_visitor_pageviews` (`entered_at`);--> statement-breakpoint
CREATE INDEX `svs_visitor_started_idx` ON `site_visitor_sessions` (`visitor_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `svs_started_idx` ON `site_visitor_sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `svs_channel_started_idx` ON `site_visitor_sessions` (`channel`,`started_at`);--> statement-breakpoint
CREATE INDEX `svs_utm_campaign_idx` ON `site_visitor_sessions` (`utm_campaign`,`started_at`);--> statement-breakpoint
CREATE INDEX `svs_landing_idx` ON `site_visitor_sessions` (`landing_path`,`started_at`);--> statement-breakpoint
CREATE INDEX `site_visitors_last_seen_idx` ON `site_visitors` (`last_seen_at`);--> statement-breakpoint
CREATE INDEX `site_visitors_first_channel_idx` ON `site_visitors` (`first_channel`,`first_seen_at`);