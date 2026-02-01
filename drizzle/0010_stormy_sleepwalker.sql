CREATE TABLE `videoReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`reactionType` enum('love','laugh','wow','sad','fire','clap','thinking','heart_eyes') NOT NULL,
	`timestamp` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `timestamp` int;