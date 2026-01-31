ALTER TABLE `comments` ADD `youtubeCommentId` varchar(128);--> statement-breakpoint
ALTER TABLE `comments` ADD `youtubeAuthorName` varchar(255);--> statement-breakpoint
ALTER TABLE `comments` ADD `youtubeAuthorChannelId` varchar(64);--> statement-breakpoint
ALTER TABLE `comments` ADD `youtubePublishedAt` timestamp;