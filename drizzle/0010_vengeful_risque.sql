ALTER TABLE `users` ADD `removedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `removedAt` timestamp NULL;
ALTER TABLE `users` ADD `removedByAdminId` int;
