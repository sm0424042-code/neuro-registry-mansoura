CREATE TABLE `user_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderUserId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_messages_id` PRIMARY KEY(`id`)
);
