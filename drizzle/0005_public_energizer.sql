ALTER TABLE `patient_records` MODIFY COLUMN `cohort` enum('stroke','multiple_sclerosis','abnormal_movements','guillain_barre','myasthenia_gravis','myelopathy','neuro_ophthalmology','cidp') NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` MODIFY COLUMN `sex` enum('female','male','not_recorded') NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `completenessStatus` enum('complete','incomplete','needs_review') DEFAULT 'incomplete' NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `missingItems` json NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `completionOwnerUserId` int;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `protocolInvestigations` json NOT NULL;