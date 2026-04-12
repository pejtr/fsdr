CREATE TABLE `aiPersonas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`personality` enum('flirty','friendly','professional','playful','mysterious') NOT NULL DEFAULT 'friendly',
	`tone` enum('casual','formal','seductive','sweet','bold') NOT NULL DEFAULT 'casual',
	`language` varchar(10) NOT NULL DEFAULT 'cs',
	`systemPrompt` text,
	`isActive` boolean NOT NULL DEFAULT false,
	`autoReply` boolean NOT NULL DEFAULT false,
	`replyDelay` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiPersonas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fanProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`creatorId` int NOT NULL,
	`segment` enum('new','active','vip','inactive','churned') NOT NULL DEFAULT 'new',
	`tags` text,
	`ltv` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalMessages` int NOT NULL DEFAULT 0,
	`lastActivity` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fanProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `massCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`targetSegment` enum('all','new','active','vip','inactive','churned') NOT NULL DEFAULT 'all',
	`status` enum('draft','scheduled','sent','failed') NOT NULL DEFAULT 'draft',
	`sentCount` int NOT NULL DEFAULT 0,
	`openCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `massCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartReplySuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`triggerKeywords` text,
	`replyText` text NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smartReplySuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('manager','chatter','analyst','moderator') NOT NULL DEFAULT 'chatter',
	`permissions` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `winbackCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`triggerDays` int NOT NULL DEFAULT 30,
	`message` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sentCount` int NOT NULL DEFAULT 0,
	`reconvertedCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `winbackCampaigns_id` PRIMARY KEY(`id`)
);
