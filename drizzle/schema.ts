import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export type ImmuneTherapy = {
  therapyClass: "corticosteroid" | "ivig" | "scig" | "plasma_exchange" | "b_cell_depleting" | "immunosuppressant" | "biologic" | "other";
  agent?: string | null;
  status: "planned" | "active" | "completed" | "discontinued" | "unknown";
  startDate?: string | null;
  infectionExclusionStatus?: "not_assessed" | "cleared" | "positive_or_suspected" | "referred" | "not_indicated" | "unknown";
  infectionExclusionNote?: string | null;
  note?: string | null;
};

export type MultipleSclerosisDoseAdherence = {
  therapyName: string;
  doseDate: string;
  doseStatus: "taken" | "missed" | "delayed" | "unknown";
  reason?: string | null;
};

export type CohortEvaluationItem = {
  code: string;
  label: string;
  status: "not_assessed" | "recorded" | "abnormal" | "not_applicable" | "pending";
  value?: string | null;
};
type EvaluationChecklist = { evaluationItems?: CohortEvaluationItem[] };

export type StrokeClinicalData = EvaluationChecklist & {
  cohort: "stroke";
  strokeType: "ischemic" | "hemorrhagic" | "tia" | "other" | "unknown";
  vascularTerritory: "aca" | "mca_complete" | "mca_incomplete" | "pca" | "vertebrobasilar" | "other" | "unknown";
  reperfusionTherapy: "none" | "iv_thrombolysis" | "mechanical_thrombectomy" | "both" | "unknown";
  toastEtiology: "large_artery" | "cardioembolic" | "small_vessel" | "other_determined" | "undetermined" | "unknown";
  majorComplication: "none" | "hemorrhagic_transformation" | "cerebral_edema" | "seizure" | "aspiration_pneumonia" | "dvt_pe" | "recurrent_stroke" | "other" | "unknown";
  strokeEvaluation: "nihss_and_mrs" | "nihss_only" | "mrs_only" | "not_recorded" | "unknown";
};

export type MultipleSclerosisClinicalData = EvaluationChecklist & {
  cohort: "multiple_sclerosis";
  diseaseCourse: "relapsing_remitting" | "primary_progressive" | "secondary_progressive" | "clinically_isolated_syndrome" | "unknown";
  disabilityLevel: "mild" | "moderate" | "severe" | "unknown";
  relapseActivity: "active" | "inactive" | "unknown";
  diseaseModifyingTherapy: "none" | "interferon_beta" | "glatiramer_acetate" | "dimethyl_fumarate" | "teriflunomide" | "fingolimod" | "siponimod" | "natalizumab" | "ocrelizumab" | "ofatumumab" | "cladribine" | "alemtuzumab" | "other" | "unknown";
  msfcAssessed: "yes" | "no" | "not_applicable";
  timed25FootWalkSeconds: number | null;
  nineHolePegTestSeconds: number | null;
  pasat3Score: number | null;
  tuberculinScreen: "negative" | "positive" | "indeterminate" | "not_done" | "not_required" | "unknown";
  chestTuberculosisScreen: "clear" | "abnormal" | "not_done" | "not_required" | "unknown";
  msEvaluation: "clinical_mri_msfc" | "clinical_mri" | "clinical_only" | "treatment_safety" | "unknown";
};

export type AbnormalMovementClinicalData = EvaluationChecklist & {
  cohort: "abnormal_movements";
  movementPhenotype: "tremor" | "dystonia" | "chorea" | "ataxia" | "tics" | "other" | "unknown";
  distribution: "focal" | "segmental" | "generalized" | "unknown";
  severity: "mild" | "moderate" | "severe" | "unknown";
  functionalImpact: "none" | "mild" | "moderate" | "severe" | "unknown";
  treatmentResponse: "responsive" | "partially_responsive" | "refractory" | "unknown";
  movementEvaluation: "phenomenology_and_video" | "phenomenology_only" | "imaging_reviewed" | "unknown";
};

export type GuillainBarreClinicalData = EvaluationChecklist & {
  cohort: "guillain_barre";
  variant: "aidp" | "aman" | "amsan" | "miller_fisher" | "other" | "unknown";
  disabilityScore: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "unknown";
  ventilatorySupport: "none" | "non_invasive" | "invasive" | "unknown";
  treatment: "ivig" | "plasmapheresis" | "both" | "supportive" | "unknown";
  gbsEvaluation: "gbs_disability_and_respiratory" | "gbs_disability_only" | "electrodiagnostic_reviewed" | "unknown";
};

export type MyastheniaGravisClinicalData = EvaluationChecklist & {
  cohort: "myasthenia_gravis";
  mgfaClass: "I" | "II" | "III" | "IV" | "V" | "unknown";
  antibodyStatus: "achr" | "musk" | "lrp4" | "seronegative" | "unknown";
  thymomaStatus: "present" | "absent" | "not_assessed" | "unknown";
  crisisHistory: "never" | "past" | "current" | "unknown";
  treatmentResponse: "responsive" | "partially_responsive" | "refractory" | "unknown";
  mgEvaluation: "mgfa_and_qmg" | "mgfa_only" | "respiratory_review" | "unknown";
};

export type MyelopathyClinicalData = EvaluationChecklist & {
  cohort: "myelopathy";
  level: "cervical" | "thoracic" | "lumbar" | "multilevel" | "unknown";
  cause: "degenerative" | "inflammatory" | "compressive" | "vascular" | "infectious" | "other" | "unknown";
  upperMotorNeuronSigns: "present" | "absent" | "unknown";
  lowerMotorNeuronFeatures: "present" | "absent" | "unknown";
  bladderInvolvement: "yes" | "no" | "unknown";
  myelopathyEvaluation: "mri_and_neuroexam" | "mri_only" | "csf_reviewed" | "unknown";
};

export type NeuroOphthalmologyClinicalData = EvaluationChecklist & {
  cohort: "neuro_ophthalmology";
  visualSyndrome: "optic_neuritis" | "visual_field_defect" | "diplopia" | "papilledema" | "other" | "unknown";
  laterality: "right" | "left" | "bilateral" | "unknown";
  acuityChange: "improved" | "stable" | "worsened" | "unknown";
  afferentDefect: "yes" | "no" | "unknown";
  diseaseClassification: "nmosd" | "mogad" | "giant_cell_arteritis" | "ms_associated" | "idiopathic_optic_neuritis" | "other" | "unknown";
  antibodyProfile: "aqp4_positive" | "mog_positive" | "both_negative" | "not_done" | "unknown";
  linkedSystemicDisease: "none" | "multiple_sclerosis" | "sarcoidosis" | "systemic_vasculitis" | "other" | "unknown";
  neuroOphEvaluation: "acuity_fields_oct" | "fundus_and_oct" | "antibody_workup" | "gca_pathway" | "unknown";
};

export type CIDPClinicalData = EvaluationChecklist & {
  cohort: "cidp";
  variant: "typical" | "madsam" | "distal" | "focal" | "motor" | "sensory" | "other" | "unknown";
  diagnosticPathway: "cidp" | "mononeuritis_multiplex" | "vasculitic_neuropathy" | "other" | "unknown";
  disabilityLevel: "mild" | "moderate" | "severe" | "unknown";
  emgNcsEvidence: "demyelinating" | "axonal_multifocal" | "equivocal" | "not_done" | "unknown";
  csfProteinStatus: "elevated" | "normal" | "not_done" | "unknown";
  cidpEvaluation: "emg_ncs_and_disability" | "emg_ncs_only" | "vasculitis_workup" | "unknown";
};

export type CohortClinicalData = StrokeClinicalData | MultipleSclerosisClinicalData | AbnormalMovementClinicalData | GuillainBarreClinicalData | MyastheniaGravisClinicalData | MyelopathyClinicalData | NeuroOphthalmologyClinicalData | CIDPClinicalData;
export type RadiologicalInvestigation = { modality: "mri" | "ct" | "cta" | "mra" | "dsa" | "doppler" | "pet" | "spect" | "xray" | "other"; bodyRegion: "brain" | "spine" | "chest" | "cranial_nerves" | "cerebral_vessels" | "temporal_arteries" | "peripheral_nerves" | "other"; keyFinding: string; lesionStatus: "present" | "absent" | "indeterminate" | "not_applicable"; reportReference?: string | null };
export type ResearchFile = { fileName: string; storageKey: string; url: string; mimeType: string; sizeBytes: number; category: "radiology_image" | "radiology_report" | "laboratory_report" | "other"; uploadedAt: string; uploadedByUserId: number };
export type LaboratoryInvestigation = { testName: "thyroid_function" | "hba1c" | "uric_acid" | "lipid_profile" | "ck" | "b12_folate" | "electrolytes" | "inflammatory_markers" | "autoimmune_panel" | "esr_crp" | "hepatitis_screening" | "varicella_immunity" | "renal_profile" | "other"; resultStatus: "normal" | "abnormal" | "borderline" | "not_done" | "unknown"; resultSummary?: string | null };
export type NeurologicalInvestigation = { testName: "emg_ncs" | "csf_analysis" | "fundus_examination" | "eeg" | "evoked_potentials" | "genetic_testing" | "cognitive_assessment" | "temporal_artery_assessment" | "nerve_biopsy" | "aqp4_mog_antibodies" | "other"; resultStatus: "normal" | "abnormal" | "borderline" | "not_done" | "unknown"; resultSummary?: string | null; lowerMotorNeuronRelevant?: boolean };
export type ProtocolInvestigation = { itemCode: string; status: "not_ordered" | "ordered" | "completed" | "not_indicated"; note?: string | null };
export type PatientFollowUp = { visitType: "baseline" | "routine" | "post_discharge" | "emergency" | "telemedicine" | "other"; followUpStatus: "completed" | "scheduled" | "missed" | "lost_to_follow_up" | "withdrawn"; outcome: "improved" | "stable" | "worsened" | "recurrence" | "deceased" | "unknown"; assessmentSummary: string; nextFollowUpPlan?: string | null; timepoint: "baseline" | "1_month" | "3_months" | "6_months" | "12_months" | "annual" | "unscheduled" };

export const users = mysqlTable("users", { id: int("id").autoincrement().primaryKey(), openId: varchar("openId", { length: 64 }).notNull().unique(), name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }), role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), accessStatus: mysqlEnum("accessStatus", ["pending", "approved", "suspended"]).default("pending").notNull(), removedAt: timestamp("removedAt"), removedByAdminId: int("removedByAdminId"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull() });

export const userProfiles = mysqlTable("user_profiles", {
  userId: int("userId").primaryKey(),
  avatarStorageKey: varchar("avatarStorageKey", { length: 300 }).notNull(),
  avatarMimeType: varchar("avatarMimeType", { length: 64 }).notNull(),
  avatarUpdatedAt: timestamp("avatarUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export const patientRecords = mysqlTable("patient_records", {
  id: int("id").autoincrement().primaryKey(),
  researchId: varchar("researchId", { length: 30 }).notNull().unique(),
  cohort: mysqlEnum("cohort", ["stroke", "multiple_sclerosis", "abnormal_movements", "guillain_barre", "myasthenia_gravis", "myelopathy", "neuro_ophthalmology", "cidp"]).notNull(),
  sex: mysqlEnum("sex", ["female", "male", "not_recorded"]).notNull(),
  ageAtEnrollment: int("ageAtEnrollment").notNull(),
  ageAtOnset: int("ageAtOnset"),
  consentStatus: mysqlEnum("consentStatus", ["consented", "pending", "declined", "withdrawn"]).notNull(),
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["screened", "enrolled", "completed", "withdrawn", "ineligible"]).notNull(),
  clinicalStatus: mysqlEnum("clinicalStatus", ["active", "follow_up", "completed", "deceased", "unknown"]).notNull(),
  dataQualityStatus: mysqlEnum("dataQualityStatus", ["draft", "complete", "query"]).default("draft").notNull(),
  completenessStatus: mysqlEnum("completenessStatus", ["complete", "incomplete", "needs_review"]).default("incomplete").notNull(),
  missingItems: json("missingItems").$type<string[]>().notNull(),
  completionOwnerUserId: int("completionOwnerUserId"),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 160 }).notNull(),
  briefClinicalHistory: text("briefClinicalHistory"),
  positiveExaminationFindings: text("positiveExaminationFindings"),
  dischargeTreatment: text("dischargeTreatment"),
  immuneTherapies: json("immuneTherapies").$type<ImmuneTherapy[]>().notNull(),
  msDoseAdherence: json("msDoseAdherence").$type<MultipleSclerosisDoseAdherence[]>().notNull(),
  clinicalData: json("clinicalData").$type<CohortClinicalData>().notNull(),
  radiologicalInvestigations: json("radiologicalInvestigations").$type<RadiologicalInvestigation[]>().notNull(),
  laboratoryInvestigations: json("laboratoryInvestigations").$type<LaboratoryInvestigation[]>().notNull(),
  neurologicalInvestigations: json("neurologicalInvestigations").$type<NeurologicalInvestigation[]>().notNull(),
  protocolInvestigations: json("protocolInvestigations").$type<ProtocolInvestigation[]>().notNull(),
  followUpVisits: json("followUpVisits").$type<PatientFollowUp[]>().notNull(),
  researchFiles: json("researchFiles").$type<ResearchFile[]>().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  lastModifiedByUserId: int("lastModifiedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const registryAuditLogs = mysqlTable("registry_audit_logs", { id: int("id").autoincrement().primaryKey(), patientRecordId: int("patientRecordId"), actorUserId: int("actorUserId").notNull(), action: mysqlEnum("action", ["created", "updated", "exported", "access_changed"]).notNull(), fieldSummary: varchar("fieldSummary", { length: 500 }).notNull(), occurredAt: timestamp("occurredAt").defaultNow().notNull() });
export const userMessages = mysqlTable("user_messages", { id: int("id").autoincrement().primaryKey(), senderUserId: int("senderUserId").notNull(), recipientUserId: int("recipientUserId").notNull(), body: text("body").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull() }, table => [
  index("user_messages_sender_recipient_created_idx").on(table.senderUserId, table.recipientUserId, table.createdAt),
  index("user_messages_recipient_sender_created_idx").on(table.recipientUserId, table.senderUserId, table.createdAt),
]);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PatientRecord = typeof patientRecords.$inferSelect;
export type InsertPatientRecord = typeof patientRecords.$inferInsert;
export type UserMessage = typeof userMessages.$inferSelect;
