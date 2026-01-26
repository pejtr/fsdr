CREATE TABLE `affiliateEarnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`subscriptionId` int,
	`amount` decimal(10,2) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`tier` int DEFAULT 1,
	`status` enum('pending','approved','paid') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateEarnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ageVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`verificationMethod` enum('id_document','credit_card','third_party') NOT NULL,
	`verificationProvider` varchar(64),
	`externalVerificationId` varchar(128),
	`status` enum('pending','verified','rejected','expired') DEFAULT 'pending',
	`verifiedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ageVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderationFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`flaggedBy` int,
	`reason` enum('illegal_content','underage','violence','copyright','spam','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','dismissed','action_taken') DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderationFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`creatorId` int NOT NULL,
	`status` enum('active','cancelled','expired') DEFAULT 'active',
	`priceAtPurchase` decimal(10,2) NOT NULL,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`renewsAt` timestamp,
	`paymentProvider` varchar(32),
	`externalSubscriptionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('subscription_payment','affiliate_commission','payout','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`description` text,
	`relatedSubscriptionId` int,
	`externalTransactionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`videoUrl` text NOT NULL,
	`duration` int,
	`isPremium` boolean DEFAULT true,
	`isPublished` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`likeCount` int DEFAULT 0,
	`status` enum('pending','approved','rejected','flagged') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','creator') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPrice` decimal(10,2) DEFAULT '9.99';--> statement-breakpoint
ALTER TABLE `users` ADD `isAgeVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `affiliateCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_affiliateCode_unique` UNIQUE(`affiliateCode`);