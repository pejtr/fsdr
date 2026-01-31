ALTER TABLE `videos` ADD `youtubeVideoId` varchar(32);--> statement-breakpoint
ALTER TABLE `videos` ADD `youtubeChannelId` varchar(64);--> statement-breakpoint
ALTER TABLE `videos` ADD `youtubePublishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `videos` ADD `youtubeViewCount` int;--> statement-breakpoint
ALTER TABLE `videos` ADD `youtubeLikeCount` int;--> statement-breakpoint
ALTER TABLE `videos` ADD `youtubeCommentCount` int;--> statement-breakpoint
ALTER TABLE `videos` ADD `lastYoutubeSync` timestamp;