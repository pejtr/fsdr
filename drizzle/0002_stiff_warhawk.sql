CREATE TABLE `affiliateBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`icon` varchar(32),
	`color` varchar(32),
	`tier` enum('bronze','silver','gold','platinum','diamond') DEFAULT 'bronze',
	`requirement` enum('referrals','earnings','network_size','streak','special') NOT NULL,
	`threshold` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateBadges_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliateBadges_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`)
);
