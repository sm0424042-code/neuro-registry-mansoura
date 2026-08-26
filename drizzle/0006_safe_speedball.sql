ALTER TABLE `patient_records` ADD `briefClinicalHistory` text;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `positiveExaminationFindings` text;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `dischargeTreatment` text;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `immuneTherapies` json NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_records` ADD `msDoseAdherence` json NOT NULL;