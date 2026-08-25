ALTER TABLE `patient_records` MODIFY COLUMN `cohort` enum('stroke','multiple_sclerosis','abnormal_movements','guillain_barre','myasthenia_gravis','myelopathy','neuro_ophthalmology') NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `laboratoryInvestigations` json NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `neurologicalInvestigations` json NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `followUpVisits` json NOT NULL;