CREATE TABLE `thumbnailVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeVideoId` int NOT NULL,
	`variantNumber` int NOT NULL,
	`imageUrl` text NOT NULL,
	`prompt` text,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`ctr` decimal(5,2),
	`isActive` boolean DEFAULT false,
	`isWinner` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `thumbnailVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtubeChannelStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`subscriberCount` int DEFAULT 0,
	`videoCount` int DEFAULT 0,
	`viewCount` int DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtubeChannelStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtubeChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelTitle` varchar(255),
	`channelDescription` text,
	`channelThumbnail` text,
	`subscriberCount` int DEFAULT 0,
	`videoCount` int DEFAULT 0,
	`viewCount` int DEFAULT 0,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`lastSyncedAt` timestamp,
	`isConnected` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtubeChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtubeChannels_channelId_unique` UNIQUE(`channelId`)
);
--> statement-breakpoint
CREATE TABLE `youtubeVideoStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeVideoId` int NOT NULL,
	`viewCount` int DEFAULT 0,
	`likeCount` int DEFAULT 0,
	`commentCount` int DEFAULT 0,
	`impressions` int DEFAULT 0,
	`ctr` decimal(5,2),
	`avgViewDuration` int,
	`avgViewPercentage` decimal(5,2),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtubeVideoStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtubeVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`youtubeVideoId` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`duration` int,
	`publishedAt` timestamp,
	`ytViewCount` int DEFAULT 0,
	`ytLikeCount` int DEFAULT 0,
	`ytCommentCount` int DEFAULT 0,
	`extendedVideoId` int,
	`currentThumbnailVariant` int DEFAULT 0,
	`isImported` boolean DEFAULT true,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtubeVideos_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtubeVideos_youtubeVideoId_unique` UNIQUE(`youtubeVideoId`)
);
