CREATE TABLE `chatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`context` enum('content','thumbnails','analytics','marketing','general') DEFAULT 'general',
	`messageCount` int DEFAULT 0,
	`lastMessageAt` timestamp,
	`isClosed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`sourceDocuments` json,
	`confidence` decimal(3,2),
	`wasHelpful` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `galleryComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`parentId` int,
	`likeCount` int DEFAULT 0,
	`isEdited` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleryComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `galleryLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `galleryLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `galleryRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleryRatings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `galleryVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`duration` int,
	`category` enum('tgtf','body_swap','transformation','romance','fantasy','other'),
	`tags` json,
	`viewCount` int DEFAULT 0,
	`likeCount` int DEFAULT 0,
	`commentCount` int DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`ratingCount` int DEFAULT 0,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`isPublic` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleryVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ragDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` enum('faq','tutorial','policy','feature','tip','best_practice') NOT NULL,
	`tags` json,
	`useCount` int DEFAULT 0,
	`helpfulCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ragDocuments_id` PRIMARY KEY(`id`)
);
