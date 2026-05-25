CREATE TABLE `email_sequence_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sequenceType` enum('welcome','upsell_d3','winback_d7','abandoned_checkout','renewal_reminder','vip_onboarding') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('sent','opened','clicked','converted') NOT NULL DEFAULT 'sent',
	CONSTRAINT `email_sequence_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flash_sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`discountPercent` int NOT NULL DEFAULT 30,
	`targetTier` varchar(50) NOT NULL DEFAULT 'all',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`stripePromoCode` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flash_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upsell_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromTier` varchar(50) NOT NULL,
	`toTier` varchar(50) NOT NULL,
	`discountPercent` int NOT NULL DEFAULT 50,
	`discountCode` varchar(100),
	`expiresAt` timestamp NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `upsell_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_revenue_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekStart` timestamp NOT NULL,
	`weekEnd` timestamp NOT NULL,
	`mrr` decimal(10,2) DEFAULT '0',
	`newSubscribers` int DEFAULT 0,
	`churnedSubscribers` int DEFAULT 0,
	`conversionRate` decimal(5,2) DEFAULT '0',
	`topAffiliateId` int,
	`aiRecommendations` text,
	`rawData` text,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_revenue_reports_id` PRIMARY KEY(`id`)
);
