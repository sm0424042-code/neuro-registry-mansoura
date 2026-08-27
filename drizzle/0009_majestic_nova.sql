CREATE TABLE `user_profiles` (
	`userId` int NOT NULL,
	`avatarStorageKey` varchar(300) NOT NULL,
	`avatarMimeType` varchar(64) NOT NULL,
	`avatarUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_userId` PRIMARY KEY(`userId`)
);
