ALTER TABLE `administrator_notifications` MODIFY COLUMN `taskId` int;--> statement-breakpoint
ALTER TABLE `administrator_notifications` MODIFY COLUMN `eventType` enum('assigned','accepted','completed','reassigned','record_completion_changed') NOT NULL;--> statement-breakpoint
ALTER TABLE `administrator_notifications` ADD `patientRecordId` int;