CREATE TABLE `forum_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topicId` int,
	`replyId` int,
	`voteType` enum('upvote','downvote') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forum_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photo_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`parentId` int,
	`likeCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photo_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photo_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`description` text,
	`imageUrl` text NOT NULL,
	`thumbnailUrl` text,
	`category` enum('transformation','fashion','makeup','lifestyle','before_after','cosplay','other') DEFAULT 'other',
	`tags` json,
	`likeCount` int DEFAULT 0,
	`commentCount` int DEFAULT 0,
	`viewCount` int DEFAULT 0,
	`isPublic` boolean DEFAULT true,
	`isPremium` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transformation_showcase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`beforeImageUrl` text NOT NULL,
	`afterImageUrl` text NOT NULL,
	`category` enum('mtf','ftm','crossdress','makeup','fashion','cosplay','other') DEFAULT 'other',
	`likeCount` int DEFAULT 0,
	`commentCount` int DEFAULT 0,
	`isPublic` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transformation_showcase_id` PRIMARY KEY(`id`)
);
