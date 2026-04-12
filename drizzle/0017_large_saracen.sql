CREATE TABLE `onboardingEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stepId` varchar(50) NOT NULL,
	`action` enum('view','skip','complete') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboardingEvents_id` PRIMARY KEY(`id`)
);
