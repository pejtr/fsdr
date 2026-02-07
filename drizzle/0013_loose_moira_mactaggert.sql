CREATE TABLE `badgeDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(500) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`category` enum('milestone','community','content','special') NOT NULL,
	`requirement` varchar(255) NOT NULL,
	`requiredValue` int NOT NULL DEFAULT 1,
	`pointsReward` int NOT NULL DEFAULT 10,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badgeDefinitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`contentType` enum('forum_topic','forum_reply','photo','comment','video','profile') NOT NULL,
	`contentId` int NOT NULL,
	`reason` enum('spam','harassment','inappropriate','misinformation','copyright','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userReputation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL DEFAULT 0,
	`rank` enum('newcomer','member','contributor','expert','legend') NOT NULL DEFAULT 'newcomer',
	`postsCount` int NOT NULL DEFAULT 0,
	`repliesCount` int NOT NULL DEFAULT 0,
	`upvotesReceived` int NOT NULL DEFAULT 0,
	`likesReceived` int NOT NULL DEFAULT 0,
	`photosUploaded` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userReputation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('new_follower','new_subscriber','new_message','new_comment','new_like','payout','badge','system','forum_reply','forum_mention','verification_approved','verification_rejected','rank_up','new_badge') NOT NULL;