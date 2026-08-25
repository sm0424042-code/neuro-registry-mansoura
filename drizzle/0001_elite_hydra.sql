CREATE TABLE `patient_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`researchId` varchar(24) NOT NULL,
	`cohort` enum('stroke','myasthenia_gravis','guillain_barre','myopathy') NOT NULL,
	`sex` enum('female','male','intersex','not_recorded') NOT NULL,
	`ageAtEnrollment` int NOT NULL,
	`ageAtOnset` int,
	`consentStatus` enum('consented','pending','declined','withdrawn') NOT NULL,
	`enrollmentStatus` enum('screened','enrolled','completed','withdrawn','ineligible') NOT NULL,
	`clinicalStatus` enum('active','follow_up','completed','deceased','unknown') NOT NULL,
	`primaryDiagnosis` varchar(160) NOT NULL,
	`dataQualityStatus` enum('draft','complete','query') NOT NULL DEFAULT 'draft',
	`clinicalData` json NOT NULL,
	`createdByUserId` int NOT NULL,
	`lastModifiedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patient_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `patient_records_researchId_unique` UNIQUE(`researchId`)
);
--> statement-breakpoint
CREATE TABLE `registry_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientRecordId` int,
	`actorUserId` int NOT NULL,
	`action` enum('created','updated','exported','access_changed') NOT NULL,
	`fieldSummary` varchar(500) NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `registry_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accessStatus` enum('pending','approved','suspended') DEFAULT 'pending' NOT NULL;