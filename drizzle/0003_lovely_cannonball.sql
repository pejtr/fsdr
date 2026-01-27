CREATE TABLE `affiliateClicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateCode` varchar(32) NOT NULL,
	`utmSource` varchar(64),
	`utmMedium` varchar(64),
	`utmCampaign` varchar(128),
	`utmContent` varchar(128),
	`ipHash` varchar(64),
	`userAgent` text,
	`referer` text,
	`convertedToSignup` boolean DEFAULT false,
	`convertedToSubscription` boolean DEFAULT false,
	`convertedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateClicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bannerVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`size` varchar(32) NOT NULL,
	`isActive` boolean DEFAULT true,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bannerVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredMethod` enum('paypal','bank_transfer','crypto') DEFAULT 'paypal',
	`paypalEmail` varchar(320),
	`bankAccountName` varchar(128),
	`bankAccountNumber` varchar(64),
	`bankRoutingNumber` varchar(32),
	`bankName` varchar(128),
	`bankSwift` varchar(16),
	`bankIban` varchar(64),
	`cryptoWalletAddress` varchar(128),
	`cryptoCurrency` varchar(16),
	`minimumPayout` decimal(10,2) DEFAULT '50.00',
	`autoPayoutEnabled` boolean DEFAULT false,
	`autoPayoutThreshold` decimal(10,2) DEFAULT '100.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `payoutRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`paymentMethod` enum('paypal','bank_transfer','crypto') NOT NULL,
	`paymentDetails` text,
	`status` enum('pending','processing','completed','rejected') DEFAULT 'pending',
	`processedAt` timestamp,
	`processedBy` int,
	`rejectionReason` text,
	`transactionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payoutRequests_id` PRIMARY KEY(`id`)
);
