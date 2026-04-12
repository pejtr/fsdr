CREATE TABLE `promptTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` enum('cinematic','transformation','time_freeze','action','fantasy','romance','horror','comedy','custom') NOT NULL,
	`engine` varchar(50) NOT NULL DEFAULT 'seedance-2.0',
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`tags` text,
	`cameraStyle` varchar(100),
	`duration` int DEFAULT 15,
	`aspectRatio` varchar(20) DEFAULT '16:9',
	`isPublic` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promptTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userVideoProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`templateId` int,
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`engine` varchar(50) NOT NULL DEFAULT 'seedance-2.0',
	`duration` int DEFAULT 15,
	`aspectRatio` varchar(20) DEFAULT '16:9',
	`status` enum('draft','generating','completed','failed') NOT NULL DEFAULT 'draft',
	`videoUrl` text,
	`thumbnailUrl` text,
	`errorMessage` text,
	`taskId` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userVideoProjects_id` PRIMARY KEY(`id`)
);
