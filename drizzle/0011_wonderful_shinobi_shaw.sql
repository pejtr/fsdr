CREATE TABLE `affiliate_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`affiliateUrl` text NOT NULL,
	`categoryId` int,
	`price` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`commission` decimal(5,2),
	`merchant` varchar(100),
	`isActive` boolean DEFAULT true,
	`clickCount` int DEFAULT 0,
	`conversionCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`parentId` int,
	`icon` varchar(50),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `dating_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`action` enum('like','super_like','pass') NOT NULL,
	`isMatch` boolean DEFAULT false,
	`matchedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dating_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dating_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forum_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `forum_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`likeCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`isPinned` boolean DEFAULT false,
	`isLocked` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`lastReplyAt` timestamp,
	`lastReplyBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `premium_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('supporter','premium','vip','creator') NOT NULL,
	`status` enum('active','cancelled','expired','paused') DEFAULT 'active',
	`priceMonthly` decimal(10,2),
	`billingCycle` enum('monthly','yearly') DEFAULT 'monthly',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premium_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `style_guides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`coverImage` text,
	`categoryId` int,
	`tags` json,
	`difficulty` enum('beginner','intermediate','advanced'),
	`readTime` int,
	`viewCount` int DEFAULT 0,
	`likeCount` int DEFAULT 0,
	`isPremium` boolean DEFAULT false,
	`isPublished` boolean DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `style_guides_id` PRIMARY KEY(`id`),
	CONSTRAINT `style_guides_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(100),
	`pronouns` varchar(50),
	`identityType` enum('crossdresser','femboy','transgender','non_binary','questioning','ally','other'),
	`lookingFor` json,
	`interests` json,
	`location` varchar(100),
	`showLocation` boolean DEFAULT false,
	`ageRange` varchar(20),
	`relationshipStatus` enum('single','in_relationship','married','its_complicated','prefer_not_say'),
	`experienceLevel` enum('curious','beginner','intermediate','experienced','mentor'),
	`galleryImages` json,
	`socialLinks` json,
	`isPublic` boolean DEFAULT true,
	`isVerified` boolean DEFAULT false,
	`lastActive` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
