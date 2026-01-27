CREATE TABLE `generatedSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` int,
	`segmentNumber` int NOT NULL,
	`prompt` text NOT NULL,
	`referenceImageUrl` text,
	`model` enum('hailuo_ai','veo_3','wan_2_6') NOT NULL,
	`duration` int DEFAULT 6000,
	`includeNude` boolean DEFAULT false,
	`includeAudio` boolean DEFAULT true,
	`videoUrl` text,
	`audioUrl` text,
	`status` enum('pending','generating','completed','failed') DEFAULT 'pending',
	`errorMessage` text,
	`qualityScore` decimal(3,2),
	`userRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `generatedSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sceneScreenshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sceneId` int NOT NULL,
	`projectId` int NOT NULL,
	`frameNumber` int NOT NULL,
	`timestamp` int NOT NULL,
	`imageUrl` text NOT NULL,
	`thumbnailUrl` text,
	`isSelected` boolean DEFAULT false,
	`description` text,
	`suggestedPrompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sceneScreenshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoGenerationJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`segmentId` int,
	`jobType` enum('analysis','screenshot','generation','merge') NOT NULL,
	`externalJobId` varchar(128),
	`provider` enum('hailuo_ai','veo_3','wan_2_6','internal') NOT NULL,
	`status` enum('queued','processing','completed','failed','cancelled') DEFAULT 'queued',
	`progress` int DEFAULT 0,
	`errorMessage` text,
	`queuedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`estimatedCost` decimal(10,4),
	`actualCost` decimal(10,4),
	CONSTRAINT `videoGenerationJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sourceType` enum('upload','url','youtube') NOT NULL,
	`sourceUrl` text,
	`sourceVideoId` int,
	`originalDuration` int,
	`projectType` enum('remake','sequel','extend_scene') DEFAULT 'extend_scene',
	`analysisStatus` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`analysisResult` text,
	`targetModel` enum('hailuo_ai','veo_3','wan_2_6') DEFAULT 'wan_2_6',
	`generateNude` boolean DEFAULT false,
	`generateAudio` boolean DEFAULT true,
	`outputVideoUrl` text,
	`outputDuration` int,
	`status` enum('draft','analyzing','generating','completed','failed') DEFAULT 'draft',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoScenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneNumber` int NOT NULL,
	`startTime` int NOT NULL,
	`endTime` int NOT NULL,
	`duration` int NOT NULL,
	`sceneType` enum('dialogue','action','romantic','kiss','intimate','transition','other') DEFAULT 'other',
	`isKeyScene` boolean DEFAULT false,
	`description` text,
	`prompt` text,
	`characters` text,
	`emotions` text,
	`canExtend` boolean DEFAULT false,
	`extensionSuggestion` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoScenes_id` PRIMARY KEY(`id`)
);
