CREATE TABLE `administrator_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientUserId` int NOT NULL,
	`taskId` int NOT NULL,
	`eventType` enum('assigned','accepted','completed','reassigned') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `administrator_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `record_completion_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientRecordId` int NOT NULL,
	`assignedToUserId` int NOT NULL,
	`assignedByAdminId` int NOT NULL,
	`status` enum('assigned','accepted','completed','reassigned') NOT NULL DEFAULT 'assigned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `record_completion_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `administrator_notifications_recipient_read_created_idx` ON `administrator_notifications` (`recipientUserId`,`readAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `record_completion_tasks_assignee_status_idx` ON `record_completion_tasks` (`assignedToUserId`,`status`);--> statement-breakpoint
CREATE INDEX `record_completion_tasks_record_status_idx` ON `record_completion_tasks` (`patientRecordId`,`status`);