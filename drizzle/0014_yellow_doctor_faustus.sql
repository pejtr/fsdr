CREATE TABLE `ctaTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testName` varchar(100) NOT NULL,
	`location` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`winnerVariantId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctaTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ctaVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`variantName` varchar(50) NOT NULL,
	`buttonText` varchar(100) NOT NULL,
	`buttonColor` varchar(50),
	`subText` varchar(200),
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ctaVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialProofEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('signup','subscription','purchase') NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`location` varchar(100),
	`tierName` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialProofEvents_id` PRIMARY KEY(`id`)
);
