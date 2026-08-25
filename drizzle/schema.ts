import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export type StrokeClinicalData = {
  cohort: "stroke";
  strokeType: "ischemic" | "hemorrhagic" | "tia" | "other" | "unknown";
  vascularTerritory: "anterior" | "posterior" | "multiple" | "unknown";
  nihssAtPresentation?: number | null;
  mRsAtDischarge?: number | null;
  reperfusionTherapy: "none" | "iv_thrombolysis" | "mechanical_thrombectomy" | "both" | "unknown";
  toastEtiology: "large_artery" | "cardioembolic" | "small_vessel" | "other_determined" | "undetermined" | "unknown";
};

export type MyastheniaClinicalData = {
  cohort: "myasthenia_gravis";
  mgfaClass: "I" | "II" | "III" | "IV" | "V" | "unknown";
  antibodyStatus: "achr" | "musk" | "lrp4" | "seronegative" | "unknown";
  thymomaStatus: "present" | "absent" | "not_assessed" | "unknown";
  myasthenicCrisis: "never" | "past" | "current" | "unknown";
  treatmentClass: "symptomatic" | "immunosuppression" | "biologic" | "thymectomy" | "none" | "unknown";
};

export type GbsClinicalData = {
  cohort: "guillain_barre";
  gbsVariant: "classical_aidp" | "aman" | "amsan" | "miller_fisher" | "other" | "unknown";
  hughesDisabilityScore?: number | null;
  ventilatorySupport: "none" | "non_invasive" | "invasive" | "unknown";
  antecedentInfection: "yes" | "no" | "unknown";
  treatment: "ivig" | "plasmapheresis" | "both" | "supportive" | "unknown";
};

export type MyopathyClinicalData = {
  cohort: "myopathy";
  myopathySubtype: "inflammatory" | "genetic" | "metabolic" | "muscular_dystrophy" | "mitochondrial" | "endocrine_toxic" | "other" | "unknown";
  geneticConfirmation: "confirmed" | "not_confirmed" | "not_tested" | "unknown";
  ckLevel?: number | null;
  muscleBiopsy: "yes" | "no" | "not_done" | "unknown";
  cardiacInvolvement: "yes" | "no" | "unknown";
};

export type CohortClinicalData = StrokeClinicalData | MyastheniaClinicalData | GbsClinicalData | MyopathyClinicalData;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accessStatus: mysqlEnum("accessStatus", ["pending", "approved", "suspended"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const patientRecords = mysqlTable("patient_records", {
  id: int("id").autoincrement().primaryKey(),
  researchId: varchar("researchId", { length: 24 }).notNull().unique(),
  cohort: mysqlEnum("cohort", ["stroke", "myasthenia_gravis", "guillain_barre", "myopathy"]).notNull(),
  sex: mysqlEnum("sex", ["female", "male", "intersex", "not_recorded"]).notNull(),
  ageAtEnrollment: int("ageAtEnrollment").notNull(),
  ageAtOnset: int("ageAtOnset"),
  consentStatus: mysqlEnum("consentStatus", ["consented", "pending", "declined", "withdrawn"]).notNull(),
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["screened", "enrolled", "completed", "withdrawn", "ineligible"]).notNull(),
  clinicalStatus: mysqlEnum("clinicalStatus", ["active", "follow_up", "completed", "deceased", "unknown"]).notNull(),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 160 }).notNull(),
  dataQualityStatus: mysqlEnum("dataQualityStatus", ["draft", "complete", "query"]).default("draft").notNull(),
  clinicalData: json("clinicalData").$type<CohortClinicalData>().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  lastModifiedByUserId: int("lastModifiedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const registryAuditLogs = mysqlTable("registry_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  patientRecordId: int("patientRecordId"),
  actorUserId: int("actorUserId").notNull(),
  action: mysqlEnum("action", ["created", "updated", "exported", "access_changed"]).notNull(),
  fieldSummary: varchar("fieldSummary", { length: 500 }).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PatientRecord = typeof patientRecords.$inferSelect;
export type InsertPatientRecord = typeof patientRecords.$inferInsert;
