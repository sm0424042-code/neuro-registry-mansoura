import { and, asc, count, desc, eq, gte, like, lt, lte, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { and as sqlAnd, isNull, or as sqlOr } from "drizzle-orm";
import { administratorNotifications, InsertUser, patientRecords, recordCompletionTasks, registryAuditLogs, userMessages, userProfiles, users } from "../drizzle/schema";
import type { CohortClinicalData, ImmuneTherapy, LaboratoryInvestigation, MultipleSclerosisDoseAdherence, NeurologicalInvestigation, PatientFollowUp, ProtocolInvestigation, RadiologicalInvestigation, ResearchFile } from "../drizzle/schema";
import { storageGetSignedUrl, storagePut } from "./storage";
import { ENV } from "./_core/env";
import type { z } from "zod";
import { getInvestigationCoverage, getPatientUpdateAuditSummary, getRegistryStatisticsDateRangeBounds } from "./registry";
import type { patientInputSchema, registryFiltersSchema, registryStatisticsFiltersSchema } from "./registry";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export function getRemovedAccountReapplicationReset(isOwner: boolean, removedAt: Date | null | undefined) {
  if (isOwner || !removedAt) return null;
  return { role: "user" as const, accessStatus: "pending" as const, removedAt: null, removedByAdminId: null };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const isOwner = user.openId === ENV.ownerOpenId;
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
    ...(isOwner ? { role: "admin", accessStatus: "approved" } : {}),
  };
  const updateSet: Record<string, unknown> = {
    name: values.name,
    email: values.email,
    loginMethod: values.loginMethod,
    lastSignedIn: values.lastSignedIn,
  };
  if (isOwner) {
    updateSet.role = "admin";
    updateSet.accessStatus = "approved";
  }
  const existing = await db.select({ removedAt: users.removedAt }).from(users).where(eq(users.openId, user.openId)).limit(1);
  const reapplicationReset = getRemovedAccountReapplicationReset(isOwner, existing[0]?.removedAt);
  if (reapplicationReset) {
    await db.update(users).set({ ...updateSet, ...reapplicationReset }).where(eq(users.openId, user.openId));
    return;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listUsersForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, accessStatus: users.accessStatus, oauthIdentityLinked: sql<boolean>`${users.openId} <> ''`, isPrimaryOwner: sql<boolean>`${users.openId} = ${ENV.ownerOpenId ?? ""}`, lastSignedIn: users.lastSignedIn, updatedAt: users.updatedAt }).from(users).where(isNull(users.removedAt)).orderBy(asc(users.name));
}

export async function listAssignableUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(sqlAnd(eq(users.accessStatus, "approved"), isNull(users.removedAt))).orderBy(asc(users.name));
}

export async function setUserAccessStatus(userId: number, accessStatus: "pending" | "approved" | "suspended") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(users).set({ accessStatus }).where(eq(users.id, userId));
}

export async function getUserAdministrationState(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ id: users.id, openId: users.openId, role: users.role, accessStatus: users.accessStatus, removedAt: users.removedAt }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function setUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function removeUserFromRegistry(userId: number, removedByAdminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(users).set({ accessStatus: "suspended", role: "user", removedAt: new Date(), removedByAdminId }).where(eq(users.id, userId));
}

export async function getOwnProfileAvatar(userId: number) {
  const db = requireDb(await getDb());
  const result = await db.select({ storageKey: userProfiles.avatarStorageKey, mimeType: userProfiles.avatarMimeType, updatedAt: userProfiles.avatarUpdatedAt }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const avatar = result[0];
  if (!avatar) return null;
  return { mimeType: avatar.mimeType, updatedAt: avatar.updatedAt, url: await storageGetSignedUrl(avatar.storageKey) };
}

export async function replaceOwnProfileAvatar(userId: number, upload: { content: Buffer; mimeType: "image/jpeg" | "image/png" | "image/webp" }) {
  const db = requireDb(await getDb());
  const extension = upload.mimeType === "image/jpeg" ? "jpg" : upload.mimeType === "image/png" ? "png" : "webp";
  const stored = await storagePut(`user-profiles/${userId}/avatar.${extension}`, upload.content, upload.mimeType);
  await db.insert(userProfiles).values({ userId, avatarStorageKey: stored.key, avatarMimeType: upload.mimeType }).onDuplicateKeyUpdate({ set: { avatarStorageKey: stored.key, avatarMimeType: upload.mimeType, avatarUpdatedAt: new Date() } });
  return { mimeType: upload.mimeType, url: await storageGetSignedUrl(stored.key) };
}

type PatientInput = z.infer<typeof patientInputSchema>;
type RegistryFilters = z.infer<typeof registryFiltersSchema>;
type RegistryStatisticsFilters = z.infer<typeof registryStatisticsFiltersSchema>;

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

function recordedByDisplayName() {
  return sql<string | null>`NULLIF(TRIM(${users.name}), '')`;
}

export async function createPatientRecord(input: PatientInput, actorUserId: number) {
  const db = requireDb(await getDb());
  await db.insert(patientRecords).values({ ...input, ageAtOnset: input.ageAtOnset ?? null, completionOwnerUserId: input.completionOwnerUserId ?? null, briefClinicalHistory: input.briefClinicalHistory ?? null, positiveExaminationFindings: input.positiveExaminationFindings ?? null, dischargeTreatment: input.dischargeTreatment ?? null, immuneTherapies: input.immuneTherapies as ImmuneTherapy[], msDoseAdherence: input.msDoseAdherence as MultipleSclerosisDoseAdherence[], clinicalData: input.clinicalData as CohortClinicalData, radiologicalInvestigations: input.radiologicalInvestigations as RadiologicalInvestigation[], laboratoryInvestigations: input.laboratoryInvestigations as LaboratoryInvestigation[], neurologicalInvestigations: input.neurologicalInvestigations as NeurologicalInvestigation[], protocolInvestigations: input.protocolInvestigations as ProtocolInvestigation[], followUpVisits: input.followUpVisits as PatientFollowUp[], researchFiles: [], createdByUserId: actorUserId, lastModifiedByUserId: actorUserId });
  const result = await db.select().from(patientRecords).where(eq(patientRecords.researchId, input.researchId)).limit(1);
  const created = result[0];
  if (!created) throw new Error("The patient record could not be created");
  await db.insert(registryAuditLogs).values({ patientRecordId: created.id, actorUserId, action: "created", fieldSummary: "Research record created" });
  return created;
}

export async function updatePatientRecord(id: number, input: PatientInput, actorUserId: number) { return updatePatientRecordWithDb(requireDb(await getDb()), id, input, actorUserId); }

export async function updatePatientRecordWithDb(db: any, id: number, input: PatientInput, actorUserId: number) {
  const existing = await db.select({ id: patientRecords.id, completenessStatus: patientRecords.completenessStatus }).from(patientRecords).where(eq(patientRecords.id, id)).limit(1);
  if (!existing[0]) throw new Error("Patient record not found");
  await db.update(patientRecords).set({ ...input, ageAtOnset: input.ageAtOnset ?? null, completionOwnerUserId: input.completionOwnerUserId ?? null, briefClinicalHistory: input.briefClinicalHistory ?? null, positiveExaminationFindings: input.positiveExaminationFindings ?? null, dischargeTreatment: input.dischargeTreatment ?? null, immuneTherapies: input.immuneTherapies as ImmuneTherapy[], msDoseAdherence: input.msDoseAdherence as MultipleSclerosisDoseAdherence[], clinicalData: input.clinicalData as CohortClinicalData, radiologicalInvestigations: input.radiologicalInvestigations as RadiologicalInvestigation[], laboratoryInvestigations: input.laboratoryInvestigations as LaboratoryInvestigation[], neurologicalInvestigations: input.neurologicalInvestigations as NeurologicalInvestigation[], protocolInvestigations: input.protocolInvestigations as ProtocolInvestigation[], followUpVisits: input.followUpVisits as PatientFollowUp[], lastModifiedByUserId: actorUserId }).where(eq(patientRecords.id, id));
  await db.insert(registryAuditLogs).values({ patientRecordId: id, actorUserId, action: "updated", fieldSummary: getPatientUpdateAuditSummary(input) });
  if (shouldNotifyRecordCompletionStatusChange(existing[0].completenessStatus, input.completenessStatus)) await createAdministratorTaskNotifications(db, { patientRecordId: id, eventType: "record_completion_changed" });
  const result = await db.select().from(patientRecords).where(eq(patientRecords.id, id)).limit(1);
  return result[0];
}

export async function getPatientRecord(id: number) {
  const db = requireDb(await getDb());
  const result = await db.select({ record: patientRecords, recordedBy: recordedByDisplayName() }).from(patientRecords).leftJoin(users, eq(patientRecords.createdByUserId, users.id)).where(eq(patientRecords.id, id)).limit(1);
  return result[0] ? { ...result[0].record, recordedBy: result[0].recordedBy } : undefined;
}

export async function listPatientRecords(filters?: RegistryFilters) {
  const db = requireDb(await getDb());
  const conditions: SQL[] = [];
  if (filters?.cohort) conditions.push(eq(patientRecords.cohort, filters.cohort));
  if (filters?.consentStatus) conditions.push(eq(patientRecords.consentStatus, filters.consentStatus));
  if (filters?.enrollmentStatus) conditions.push(eq(patientRecords.enrollmentStatus, filters.enrollmentStatus));
  if (filters?.clinicalStatus) conditions.push(eq(patientRecords.clinicalStatus, filters.clinicalStatus));
  if (filters?.dataQualityStatus) conditions.push(eq(patientRecords.dataQualityStatus, filters.dataQualityStatus));
  if (filters?.completenessStatus) conditions.push(eq(patientRecords.completenessStatus, filters.completenessStatus));
  if (filters?.completionOwnerUserId) conditions.push(eq(patientRecords.completionOwnerUserId, filters.completionOwnerUserId));
  if (filters?.search) conditions.push(like(patientRecords.researchId, `%${filters.search.toUpperCase()}%`));
  if (filters?.ageMin !== undefined) conditions.push(gte(patientRecords.ageAtEnrollment, filters.ageMin));
  if (filters?.ageMax !== undefined) conditions.push(lte(patientRecords.ageAtEnrollment, filters.ageMax));
  const query = db.select({ id: patientRecords.id, researchId: patientRecords.researchId, cohort: patientRecords.cohort, sex: patientRecords.sex, ageAtEnrollment: patientRecords.ageAtEnrollment, consentStatus: patientRecords.consentStatus, enrollmentStatus: patientRecords.enrollmentStatus, clinicalStatus: patientRecords.clinicalStatus, primaryDiagnosis: patientRecords.primaryDiagnosis, dataQualityStatus: patientRecords.dataQualityStatus, completenessStatus: patientRecords.completenessStatus, missingItems: patientRecords.missingItems, completionOwnerUserId: patientRecords.completionOwnerUserId, recordedBy: recordedByDisplayName(), updatedAt: patientRecords.updatedAt }).from(patientRecords).leftJoin(users, eq(patientRecords.createdByUserId, users.id));
  return conditions.length ? query.where(and(...conditions)).orderBy(desc(patientRecords.updatedAt)) : query.orderBy(desc(patientRecords.updatedAt));
}

export async function getRegistryOverview() {
  const db = requireDb(await getDb());
  const [total] = await db.select({ total: count() }).from(patientRecords);
  const byCohort = await db.select({ cohort: patientRecords.cohort, total: count() }).from(patientRecords).groupBy(patientRecords.cohort);
  const byEnrollment = await db.select({ status: patientRecords.enrollmentStatus, total: count() }).from(patientRecords).groupBy(patientRecords.enrollmentStatus);
  const byCompleteness = await db.select({ status: patientRecords.completenessStatus, total: count() }).from(patientRecords).groupBy(patientRecords.completenessStatus);
  const investigationRows = await db.select({ radiologicalInvestigations: patientRecords.radiologicalInvestigations, laboratoryInvestigations: patientRecords.laboratoryInvestigations, neurologicalInvestigations: patientRecords.neurologicalInvestigations, protocolInvestigations: patientRecords.protocolInvestigations }).from(patientRecords);
  return { total: total?.total ?? 0, byCohort, byEnrollment, byCompleteness, investigationCoverage: getInvestigationCoverage(investigationRows) };
}

function getRegistryStatisticsConditions(filters?: RegistryStatisticsFilters) {
  const conditions: SQL[] = [];
  if (filters?.cohort) conditions.push(eq(patientRecords.cohort, filters.cohort));
  if (filters?.enrollmentStatus) conditions.push(eq(patientRecords.enrollmentStatus, filters.enrollmentStatus));
  if (filters?.dataQualityStatus) conditions.push(eq(patientRecords.dataQualityStatus, filters.dataQualityStatus));
  if (filters?.completenessStatus) conditions.push(eq(patientRecords.completenessStatus, filters.completenessStatus));
  const { start, endExclusive } = getRegistryStatisticsDateRangeBounds(filters?.startDate, filters?.endDate);
  if (start) conditions.push(gte(patientRecords.createdAt, start));
  if (endExclusive) conditions.push(lt(patientRecords.createdAt, endExclusive));
  return conditions;
}

async function runRegistryStatisticsQuery<T>(query: any, conditions: SQL[]): Promise<T[]> {
  return conditions.length ? query.where(and(...conditions)) : query;
}

export type RegistryAggregateStatisticsResult = {
  totalRecords: number;
  byCohort: Array<{ cohort: string; total: number }>;
  byEnrollment: Array<{ status: string; total: number }>;
  byCompleteness: Array<{ status: string; total: number }>;
  byDataQuality: Array<{ status: string; total: number }>;
  investigationCoverage: ReturnType<typeof getInvestigationCoverage>;
  cohortIndicators: CohortClinicalIndicator[];
};

export type CohortClinicalIndicatorRow = {
  cohort: string;
  strokeReperfusion?: string | null;
  strokeType?: string | null;
  strokeTerritory?: string | null;
  strokeComplication?: string | null;
  msDiseaseModifyingTherapy?: string | null;
  msDiseaseCourse?: string | null;
  msRelapseActivity?: string | null;
  msMsfcAssessed?: string | null;
  movementPhenotype?: string | null;
  movementSeverity?: string | null;
  movementFunctionalImpact?: string | null;
  movementTreatmentResponse?: string | null;
  gbsVariant?: string | null;
  gbsTreatment?: string | null;
  gbsVentilatorySupport?: string | null;
  gbsDisabilityScore?: string | null;
  mgAntibodyStatus?: string | null;
  mgMgfaClass?: string | null;
  mgCrisisHistory?: string | null;
  mgTreatmentResponse?: string | null;
  myelopathyCause?: string | null;
  myelopathyLevel?: string | null;
  myelopathyUpperMotorNeuronSigns?: string | null;
  myelopathyBladderInvolvement?: string | null;
  neuroOphDiseaseClassification?: string | null;
  neuroOphAntibodyProfile?: string | null;
  neuroOphVisualSyndrome?: string | null;
  neuroOphAcuityChange?: string | null;
  cidpVariant?: string | null;
  cidpDiagnosticPathway?: string | null;
  cidpEmgNcsEvidence?: string | null;
  cidpCsfProteinStatus?: string | null;
  cidpDisabilityLevel?: string | null;
  epilepsySeizureClass?: string | null;
  epilepsyType?: string | null;
  epilepsySyndromeClassification?: string | null;
  epilepsyFrequency?: string | null;
  epilepsyLastSeizureInterval?: string | null;
  epilepsyStatusEpilepticusHistory?: string | null;
  epilepsyEegAssessment?: string | null;
  epilepsyNeuroimagingAssessment?: string | null;
  epilepsyDrugResistance?: string | null;
  epilepsyMedicationCount?: string | null;
  epilepsyTreatmentResponse?: string | null;
  epilepsySafetyComorbidity?: string | null;
};
export type CohortClinicalIndicator = {
  id: string;
  cohort: string;
  title: string;
  numeratorLabel: string;
  denominatorLabel: string;
  numerator: number;
  denominator: number;
  percentage: number;
  distribution: Array<{ key: string; label: string; total: number; percentage: number }>;
};
type CohortClinicalIndicatorDefinition = {
  id: string;
  cohort: string;
  title: string;
  numeratorLabel: string;
  denominatorLabel: string;
  field: Exclude<keyof CohortClinicalIndicatorRow, "cohort">;
  numeratorMatches: (value: string, row: CohortClinicalIndicatorRow) => boolean;
  denominatorMatches?: (row: CohortClinicalIndicatorRow) => boolean;
};
const cohortClinicalIndicatorDefinitions: CohortClinicalIndicatorDefinition[] = [
  { id: "stroke_iv_thrombolysis", cohort: "stroke", title: "IV thrombolysis use", numeratorLabel: "IV thrombolysis or combined reperfusion", denominatorLabel: "All Stroke records", field: "strokeReperfusion", numeratorMatches: value => value === "iv_thrombolysis" || value === "both" },
  { id: "stroke_ischemic_type", cohort: "stroke", title: "Ischaemic stroke type", numeratorLabel: "Ischaemic stroke", denominatorLabel: "All Stroke records", field: "strokeType", numeratorMatches: value => value === "ischemic" },
  { id: "stroke_mca_territory", cohort: "stroke", title: "MCA territory", numeratorLabel: "MCA territory", denominatorLabel: "All Stroke records", field: "strokeTerritory", numeratorMatches: value => value === "mca_complete" || value === "mca_incomplete" },
  { id: "stroke_major_complication", cohort: "stroke", title: "Major complication recorded", numeratorLabel: "Complication other than none or unknown", denominatorLabel: "All Stroke records", field: "strokeComplication", numeratorMatches: value => !["none", "unknown", "not_recorded"].includes(value) },
  { id: "ms_disease_modifying_therapy", cohort: "multiple_sclerosis", title: "Disease-modifying therapy use", numeratorLabel: "Disease-modifying therapy recorded", denominatorLabel: "All Multiple Sclerosis records", field: "msDiseaseModifyingTherapy", numeratorMatches: value => !["none", "unknown", "not_recorded"].includes(value) },
  { id: "ms_relapsing_remitting", cohort: "multiple_sclerosis", title: "Relapsing–remitting disease course", numeratorLabel: "Relapsing–remitting course", denominatorLabel: "All Multiple Sclerosis records", field: "msDiseaseCourse", numeratorMatches: value => value === "relapsing_remitting" },
  { id: "ms_active_relapse", cohort: "multiple_sclerosis", title: "Active relapse activity", numeratorLabel: "Active relapse", denominatorLabel: "All Multiple Sclerosis records", field: "msRelapseActivity", numeratorMatches: value => value === "active" },
  { id: "ms_msfc_assessed", cohort: "multiple_sclerosis", title: "MSFC assessment recorded", numeratorLabel: "MSFC assessed", denominatorLabel: "All Multiple Sclerosis records", field: "msMsfcAssessed", numeratorMatches: value => value === "yes" },
  { id: "abnormal_movements_parkinsonism", cohort: "abnormal_movements", title: "Parkinsonism phenotype", numeratorLabel: "Parkinsonism phenotype", denominatorLabel: "All Abnormal Movements records", field: "movementPhenotype", numeratorMatches: value => value === "parkinsonism" },
  { id: "abnormal_movements_severe", cohort: "abnormal_movements", title: "Severe movement symptoms", numeratorLabel: "Severe symptom severity", denominatorLabel: "All Abnormal Movements records", field: "movementSeverity", numeratorMatches: value => value === "severe" },
  { id: "abnormal_movements_functional_impact", cohort: "abnormal_movements", title: "Moderate or severe functional impact", numeratorLabel: "Moderate or severe functional impact", denominatorLabel: "All Abnormal Movements records", field: "movementFunctionalImpact", numeratorMatches: value => value === "moderate" || value === "severe" },
  { id: "abnormal_movements_treatment_response", cohort: "abnormal_movements", title: "Treatment response recorded", numeratorLabel: "Responsive or partial response", denominatorLabel: "All Abnormal Movements records", field: "movementTreatmentResponse", numeratorMatches: value => value === "responsive" || value === "partial" },
  { id: "gbs_aidp_variant", cohort: "guillain_barre", title: "AIDP variant", numeratorLabel: "AIDP variant", denominatorLabel: "All Guillain–Barré records", field: "gbsVariant", numeratorMatches: value => value === "aidp" },
  { id: "gbs_immunotherapy", cohort: "guillain_barre", title: "GBS immunotherapy", numeratorLabel: "IVIG or plasma exchange", denominatorLabel: "All Guillain–Barré records", field: "gbsTreatment", numeratorMatches: value => value === "ivig" || value === "plasma_exchange" },
  { id: "gbs_ventilatory_support", cohort: "guillain_barre", title: "Ventilatory support", numeratorLabel: "Any ventilatory support", denominatorLabel: "All Guillain–Barré records", field: "gbsVentilatorySupport", numeratorMatches: value => !["none", "not_recorded"].includes(value) },
  { id: "gbs_disability_three_or_more", cohort: "guillain_barre", title: "GBS disability score 3 or higher", numeratorLabel: "Disability score 3–6", denominatorLabel: "All Guillain–Barré records", field: "gbsDisabilityScore", numeratorMatches: value => ["3", "4", "5", "6"].includes(value) },
  { id: "mg_seropositive", cohort: "myasthenia_gravis", title: "Seropositive antibody profile", numeratorLabel: "AChR, MuSK, LRP4, titin, or agrin", denominatorLabel: "All Myasthenia Gravis records", field: "mgAntibodyStatus", numeratorMatches: value => ["achr", "musk", "lrp4", "titin", "agrin"].includes(value) },
  { id: "mg_mgfa_generalized", cohort: "myasthenia_gravis", title: "Generalized MGFA class", numeratorLabel: "MGFA class II–V", denominatorLabel: "All Myasthenia Gravis records", field: "mgMgfaClass", numeratorMatches: value => /^II|^III|^IV|^V/.test(value) },
  { id: "mg_crisis_history", cohort: "myasthenia_gravis", title: "Myasthenic crisis history", numeratorLabel: "Impending or previous crisis", denominatorLabel: "All Myasthenia Gravis records", field: "mgCrisisHistory", numeratorMatches: value => value === "impending" || value === "previous" },
  { id: "mg_treatment_response", cohort: "myasthenia_gravis", title: "MG treatment response", numeratorLabel: "Responsive or partial response", denominatorLabel: "All Myasthenia Gravis records", field: "mgTreatmentResponse", numeratorMatches: value => value === "responsive" || value === "partial" },
  { id: "myelopathy_compressive_cause", cohort: "myelopathy", title: "Compressive myelopathy cause", numeratorLabel: "Compressive cause", denominatorLabel: "All Myelopathy records", field: "myelopathyCause", numeratorMatches: value => value === "compressive" },
  { id: "myelopathy_cervical_level", cohort: "myelopathy", title: "Cervical myelopathy level", numeratorLabel: "Cervical level", denominatorLabel: "All Myelopathy records", field: "myelopathyLevel", numeratorMatches: value => value === "cervical" },
  { id: "myelopathy_umn_signs", cohort: "myelopathy", title: "Upper motor neuron signs", numeratorLabel: "UMN signs present", denominatorLabel: "All Myelopathy records", field: "myelopathyUpperMotorNeuronSigns", numeratorMatches: value => value === "present" },
  { id: "myelopathy_bladder_involvement", cohort: "myelopathy", title: "Bladder involvement", numeratorLabel: "Bladder involvement recorded", denominatorLabel: "All Myelopathy records", field: "myelopathyBladderInvolvement", numeratorMatches: value => !["no", "none", "not_recorded"].includes(value) },
  { id: "neurooph_nmosd_mogad", cohort: "neuro_ophthalmology", title: "NMOSD or MOGAD classification", numeratorLabel: "NMOSD or MOGAD classification", denominatorLabel: "All Neuro-ophthalmology records", field: "neuroOphDiseaseClassification", numeratorMatches: value => value === "nmosd" || value === "mogad" },
  { id: "neurooph_nmosd_seropositive", cohort: "neuro_ophthalmology", title: "Seropositive NMOSD", numeratorLabel: "AQP4-positive NMOSD", denominatorLabel: "All NMOSD-classified Neuro-ophthalmology records", field: "neuroOphAntibodyProfile", denominatorMatches: row => row.neuroOphDiseaseClassification === "nmosd", numeratorMatches: value => value === "aqp4_positive" || value === "both_positive" },
  { id: "neurooph_optic_neuritis", cohort: "neuro_ophthalmology", title: "Optic neuritis syndrome", numeratorLabel: "Optic neuritis", denominatorLabel: "All Neuro-ophthalmology records", field: "neuroOphVisualSyndrome", numeratorMatches: value => value === "optic_neuritis" },
  { id: "neurooph_severe_acuity_change", cohort: "neuro_ophthalmology", title: "Severe acuity reduction", numeratorLabel: "Severely reduced acuity", denominatorLabel: "All Neuro-ophthalmology records", field: "neuroOphAcuityChange", numeratorMatches: value => value === "severely_reduced" },
  { id: "cidp_typical_madsam", cohort: "cidp", title: "Typical or MADSAM CIDP phenotype", numeratorLabel: "Typical or MADSAM variant", denominatorLabel: "All CIDP records", field: "cidpVariant", numeratorMatches: value => value === "typical" || value === "madsam" },
  { id: "cidp_electrodiagnostic_evidence", cohort: "cidp", title: "Electrodiagnostic evidence", numeratorLabel: "Demyelinating or conduction-block evidence", denominatorLabel: "All CIDP records", field: "cidpEmgNcsEvidence", numeratorMatches: value => value === "demyelinating" || value === "conduction_block" },
  { id: "cidp_csf_protein_elevated", cohort: "cidp", title: "Elevated CSF protein", numeratorLabel: "Elevated or markedly elevated CSF protein", denominatorLabel: "All CIDP records", field: "cidpCsfProteinStatus", numeratorMatches: value => value === "elevated" || value === "markedly_elevated" },
  { id: "cidp_moderate_severe_disability", cohort: "cidp", title: "Moderate or severe CIDP disability", numeratorLabel: "Moderate or severe disability", denominatorLabel: "All CIDP records", field: "cidpDisabilityLevel", numeratorMatches: value => value === "moderate" || value === "severe" },
  { id: "epilepsy_focal_class", cohort: "epilepsy", title: "Focal seizure classification", numeratorLabel: "Focal seizure class", denominatorLabel: "All Epilepsy records", field: "epilepsySeizureClass", numeratorMatches: value => value === "focal" },
  { id: "epilepsy_seizure_free", cohort: "epilepsy", title: "Seizure-free status recorded", numeratorLabel: "Seizure-free category", denominatorLabel: "All Epilepsy records", field: "epilepsyFrequency", numeratorMatches: value => value === "seizure_free" },
  { id: "epilepsy_drug_resistant_confirmed", cohort: "epilepsy", title: "Confirmed drug-resistant epilepsy", numeratorLabel: "Confirmed drug-resistant status", denominatorLabel: "All Epilepsy records", field: "epilepsyDrugResistance", numeratorMatches: value => value === "confirmed" },
  { id: "epilepsy_status_epilepticus_history", cohort: "epilepsy", title: "Status epilepticus history", numeratorLabel: "Recent, remote, or current status epilepticus history", denominatorLabel: "All Epilepsy records", field: "epilepsyStatusEpilepticusHistory", numeratorMatches: value => value !== "none" && value !== "unknown" && value !== "not_recorded" },
  { id: "epilepsy_video_eeg_or_ambulatory", cohort: "epilepsy", title: "Extended EEG assessment", numeratorLabel: "Prolonged video-EEG or ambulatory EEG", denominatorLabel: "All Epilepsy records", field: "epilepsyEegAssessment", numeratorMatches: value => value === "prolonged_video_eeg" || value === "ambulatory_eeg" },
];
const cohortIndicatorValueLabels: Record<string, string> = { iv_thrombolysis: "IV thrombolysis", mechanical_thrombectomy: "Mechanical thrombectomy", both: "Combined reperfusion", relapsing_remitting: "Relapsing–remitting", primary_progressive: "Primary progressive", secondary_progressive: "Secondary progressive", clinically_isolated_syndrome: "Clinically isolated syndrome", achr: "AChR", musk: "MuSK", lrp4: "LRP4", aidp: "AIDP", aman: "AMAN", amsan: "AMSAN", miller_fisher: "Miller Fisher", pharyngeal_cervical_brachial: "Pharyngeal–cervical–brachial",   nmosd: "NMOSD", mogad: "MOGAD", cidp: "CIDP", madsam: "MADSAM", focal: "Focal", generalized: "Generalized", seizure_free: "Seizure-free", confirmed: "Confirmed", prolonged_video_eeg: "Prolonged video-EEG", ambulatory_eeg: "Ambulatory EEG", not_recorded: "Not recorded" };
export function getCohortIndicatorValueLabel(value: string) { return cohortIndicatorValueLabels[value] ?? value.replaceAll("_", " "); }
export function getCohortClinicalIndicators(rows: CohortClinicalIndicatorRow[]): CohortClinicalIndicator[] {
  return cohortClinicalIndicatorDefinitions.map(definition => {
    const cohortRows = rows.filter(row => row.cohort === definition.cohort && (definition.denominatorMatches?.(row) ?? true));
    const values = cohortRows.map(row => row[definition.field] ?? "not_recorded");
    const distribution = Array.from(values.reduce((counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1), new Map<string, number>()).entries()).map(([key, total]) => ({ key, label: getCohortIndicatorValueLabel(key), total, percentage: cohortRows.length ? Math.round((total / cohortRows.length) * 100) : 0 })).sort((left, right) => right.total - left.total || left.label.localeCompare(right.label));
    const numerator = cohortRows.filter(row => definition.numeratorMatches(row[definition.field] ?? "not_recorded", row)).length;
    return { id: definition.id, cohort: definition.cohort, title: definition.title, numeratorLabel: definition.numeratorLabel, denominatorLabel: definition.denominatorLabel, numerator, denominator: cohortRows.length, percentage: cohortRows.length ? Math.round((numerator / cohortRows.length) * 100) : 0, distribution };
  });
}
function clinicalJsonValue(path: string) { return sql<string | null>`JSON_UNQUOTE(JSON_EXTRACT(${patientRecords.clinicalData}, ${path}))`; }

async function getRegistryAggregateStatisticsForPeriod(db: any, filters?: RegistryStatisticsFilters): Promise<RegistryAggregateStatisticsResult> {
  const conditions = getRegistryStatisticsConditions(filters);
  const [total] = await runRegistryStatisticsQuery<{ total: number }>(db.select({ total: count() }).from(patientRecords), conditions);
  const byCohort = await runRegistryStatisticsQuery<{ cohort: string; total: number }>(db.select({ cohort: patientRecords.cohort, total: count() }).from(patientRecords).groupBy(patientRecords.cohort), conditions);
  const byEnrollment = await runRegistryStatisticsQuery<{ status: string; total: number }>(db.select({ status: patientRecords.enrollmentStatus, total: count() }).from(patientRecords).groupBy(patientRecords.enrollmentStatus), conditions);
  const byCompleteness = await runRegistryStatisticsQuery<{ status: string; total: number }>(db.select({ status: patientRecords.completenessStatus, total: count() }).from(patientRecords).groupBy(patientRecords.completenessStatus), conditions);
  const byDataQuality = await runRegistryStatisticsQuery<{ status: string; total: number }>(db.select({ status: patientRecords.dataQualityStatus, total: count() }).from(patientRecords).groupBy(patientRecords.dataQualityStatus), conditions);
  const investigationRows = await runRegistryStatisticsQuery<{ radiologicalInvestigations: unknown[] | null; laboratoryInvestigations: unknown[] | null; neurologicalInvestigations: unknown[] | null; protocolInvestigations: Array<{ status?: string }> | null }>(db.select({ radiologicalInvestigations: patientRecords.radiologicalInvestigations, laboratoryInvestigations: patientRecords.laboratoryInvestigations, neurologicalInvestigations: patientRecords.neurologicalInvestigations, protocolInvestigations: patientRecords.protocolInvestigations }).from(patientRecords), conditions);
  const indicatorRows = await runRegistryStatisticsQuery<CohortClinicalIndicatorRow>(db.select({ cohort: patientRecords.cohort, strokeReperfusion: clinicalJsonValue("$.reperfusionTherapy"), strokeType: clinicalJsonValue("$.strokeType"), strokeTerritory: clinicalJsonValue("$.vascularTerritory"), strokeComplication: clinicalJsonValue("$.majorComplication"), msDiseaseModifyingTherapy: clinicalJsonValue("$.diseaseModifyingTherapy"), msDiseaseCourse: clinicalJsonValue("$.diseaseCourse"), msRelapseActivity: clinicalJsonValue("$.relapseActivity"), msMsfcAssessed: clinicalJsonValue("$.msfcAssessed"), movementPhenotype: clinicalJsonValue("$.movementPhenotype"), movementSeverity: clinicalJsonValue("$.severity"), movementFunctionalImpact: clinicalJsonValue("$.functionalImpact"), movementTreatmentResponse: clinicalJsonValue("$.treatmentResponse"), gbsVariant: clinicalJsonValue("$.variant"), gbsTreatment: clinicalJsonValue("$.treatment"), gbsVentilatorySupport: clinicalJsonValue("$.ventilatorySupport"), gbsDisabilityScore: clinicalJsonValue("$.disabilityScore"), mgAntibodyStatus: clinicalJsonValue("$.antibodyStatus"), mgMgfaClass: clinicalJsonValue("$.mgfaClass"), mgCrisisHistory: clinicalJsonValue("$.crisisHistory"), mgTreatmentResponse: clinicalJsonValue("$.treatmentResponse"), myelopathyCause: clinicalJsonValue("$.cause"), myelopathyLevel: clinicalJsonValue("$.level"), myelopathyUpperMotorNeuronSigns: clinicalJsonValue("$.upperMotorNeuronSigns"), myelopathyBladderInvolvement: clinicalJsonValue("$.bladderInvolvement"), neuroOphDiseaseClassification: clinicalJsonValue("$.diseaseClassification"), neuroOphAntibodyProfile: clinicalJsonValue("$.antibodyProfile"), neuroOphVisualSyndrome: clinicalJsonValue("$.visualSyndrome"), neuroOphAcuityChange: clinicalJsonValue("$.acuityChange"), cidpVariant: clinicalJsonValue("$.variant"), cidpDiagnosticPathway: clinicalJsonValue("$.diagnosticPathway"), cidpEmgNcsEvidence: clinicalJsonValue("$.emgNcsEvidence"), cidpCsfProteinStatus: clinicalJsonValue("$.csfProteinStatus"), cidpDisabilityLevel: clinicalJsonValue("$.disabilityLevel"), epilepsySeizureClass: clinicalJsonValue("$.seizureClass"), epilepsyType: clinicalJsonValue("$.epilepsyType"), epilepsySyndromeClassification: clinicalJsonValue("$.syndromeClassification"), epilepsyFrequency: clinicalJsonValue("$.seizureFrequencyCategory"), epilepsyLastSeizureInterval: clinicalJsonValue("$.lastSeizureInterval"), epilepsyStatusEpilepticusHistory: clinicalJsonValue("$.statusEpilepticusHistory"), epilepsyEegAssessment: clinicalJsonValue("$.eegAssessment"), epilepsyNeuroimagingAssessment: clinicalJsonValue("$.neuroimagingAssessment"), epilepsyDrugResistance: clinicalJsonValue("$.drugResistantEpilepsyStatus"), epilepsyMedicationCount: clinicalJsonValue("$.antiseizureMedicationCount"), epilepsyTreatmentResponse: clinicalJsonValue("$.treatmentResponse"), epilepsySafetyComorbidity: clinicalJsonValue("$.safetyAndComorbidityScreening") }).from(patientRecords), conditions);
  return { totalRecords: total?.total ?? 0, byCohort, byEnrollment, byCompleteness, byDataQuality, investigationCoverage: getInvestigationCoverage(investigationRows), cohortIndicators: getCohortClinicalIndicators(indicatorRows) };
}

/** Returns only aggregate research-operation metrics for the current period and, when requested, a separate aggregate comparison period. */
export async function getRegistryAggregateStatistics(filters?: RegistryStatisticsFilters) {
  const db = requireDb(await getDb());
  const current = await getRegistryAggregateStatisticsForPeriod(db, filters);
  if (!filters?.comparisonStartDate || !filters.comparisonEndDate) return current;
  const comparison = await getRegistryAggregateStatisticsForPeriod(db, { ...filters, startDate: filters.comparisonStartDate, endDate: filters.comparisonEndDate });
  return { ...current, comparison };
}

export async function getPatientAuditTrail(patientRecordId: number) {
  const db = requireDb(await getDb());
  return db.select({ id: registryAuditLogs.id, action: registryAuditLogs.action, fieldSummary: registryAuditLogs.fieldSummary, occurredAt: registryAuditLogs.occurredAt, actorName: users.name }).from(registryAuditLogs).leftJoin(users, eq(registryAuditLogs.actorUserId, users.id)).where(eq(registryAuditLogs.patientRecordId, patientRecordId)).orderBy(desc(registryAuditLogs.occurredAt));
}

export async function getResearchExportRecords() {
  const db = requireDb(await getDb());
  return db.select().from(patientRecords).orderBy(asc(patientRecords.researchId));
}

export async function logResearchExport(actorUserId: number, recordCount: number) {
  const db = requireDb(await getDb());
  await db.insert(registryAuditLogs).values({ actorUserId, action: "exported", fieldSummary: `De-identified CSV export generated for ${recordCount} records` });
}

export async function appendResearchFile(patientRecordId: number, actorUserId: number, upload: { fileName: string; mimeType: string; sizeBytes: number; category: ResearchFile["category"]; content: Buffer }) {
  const db = requireDb(await getDb());
  const existing = await db.select({ researchId: patientRecords.researchId, researchFiles: patientRecords.researchFiles }).from(patientRecords).where(eq(patientRecords.id, patientRecordId)).limit(1);
  if (!existing[0]) throw new Error("Patient record not found");
  const storage = await storagePut(`research-files/${existing[0].researchId}/${upload.fileName}`, upload.content, upload.mimeType);
  const file: ResearchFile = { fileName: upload.fileName, storageKey: storage.key, url: storage.url, mimeType: upload.mimeType, sizeBytes: upload.sizeBytes, category: upload.category, uploadedAt: new Date().toISOString(), uploadedByUserId: actorUserId };
  const files = [...((existing[0].researchFiles as ResearchFile[] | null | undefined) ?? []), file];
  await db.update(patientRecords).set({ researchFiles: files, lastModifiedByUserId: actorUserId }).where(eq(patientRecords.id, patientRecordId));
  await db.insert(registryAuditLogs).values({ patientRecordId, actorUserId, action: "updated", fieldSummary: `Research file uploaded: ${upload.category}` });
  return file;
}

export async function getResearchFileUrl(patientRecordId: number, storageKey: string) { const db = requireDb(await getDb()); const result = await db.select({ researchFiles: patientRecords.researchFiles }).from(patientRecords).where(eq(patientRecords.id, patientRecordId)).limit(1); const file = ((result[0]?.researchFiles as ResearchFile[] | null | undefined) ?? []).find(item => item.storageKey === storageKey); if (!file) throw new Error("Research file not found for this record"); return { fileName: file.fileName, url: await storageGetSignedUrl(file.storageKey) }; }

type TaskEvent = "assigned" | "accepted" | "completed" | "reassigned" | "record_completion_changed";
const activeTaskStatuses = ["assigned", "accepted", "reassigned"] as const;

export function shouldNotifyRecordCompletionStatusChange(previousStatus: string | undefined, nextStatus: string) {
  return previousStatus !== undefined && previousStatus !== nextStatus;
}

export function getTaskTransitionError(currentStatus: string, assignedToUserId: number, actorUserId: number, nextStatus: "accepted" | "completed") {
  if (assignedToUserId !== actorUserId) return "Only the assigned approved member can change this task.";
  if (nextStatus === "accepted" && !["assigned", "reassigned"].includes(currentStatus)) return "Only an assigned task can be accepted.";
  if (nextStatus === "completed" && currentStatus !== "accepted") return "Accept the task before marking it complete.";
  return null;
}

async function ensureApprovedTaskAssignee(db: any, userId: number) {
  const assignee = await db.select({ id: users.id }).from(users).where(sqlAnd(eq(users.id, userId), eq(users.accessStatus, "approved"), isNull(users.removedAt))).limit(1);
  if (!assignee[0]) throw new Error("Tasks can be assigned only to an approved active registry member.");
}

async function createAdministratorTaskNotifications(db: any, reference: { taskId?: number; patientRecordId?: number; eventType: TaskEvent }) {
  const administrators = await db.select({ id: users.id }).from(users).where(sqlAnd(eq(users.role, "admin"), eq(users.accessStatus, "approved"), isNull(users.removedAt)));
  if (administrators.length) await db.insert(administratorNotifications).values(administrators.map((administrator: { id: number }) => ({ recipientUserId: administrator.id, taskId: reference.taskId ?? null, patientRecordId: reference.patientRecordId ?? null, eventType: reference.eventType })));
}

export async function assignRecordCompletionTask(patientRecordId: number, assignedToUserId: number, assignedByAdminId: number) {
  const db = requireDb(await getDb());
  const record = await db.select({ id: patientRecords.id }).from(patientRecords).where(eq(patientRecords.id, patientRecordId)).limit(1);
  if (!record[0]) throw new Error("Research record not found.");
  await ensureApprovedTaskAssignee(db, assignedToUserId);
  const active = await db.select().from(recordCompletionTasks).where(sqlAnd(eq(recordCompletionTasks.patientRecordId, patientRecordId), sqlOr(...activeTaskStatuses.map(status => eq(recordCompletionTasks.status, status))))).orderBy(desc(recordCompletionTasks.updatedAt)).limit(1);
  let eventType: TaskEvent = "assigned";
  if (active[0]) {
    eventType = "reassigned";
    await db.update(recordCompletionTasks).set({ assignedToUserId, assignedByAdminId, status: "reassigned", acceptedAt: null, completedAt: null }).where(eq(recordCompletionTasks.id, active[0].id));
  } else {
    await db.insert(recordCompletionTasks).values({ patientRecordId, assignedToUserId, assignedByAdminId, status: "assigned" });
  }
  await db.update(patientRecords).set({ completionOwnerUserId: assignedToUserId }).where(eq(patientRecords.id, patientRecordId));
  const task = (await db.select().from(recordCompletionTasks).where(eq(recordCompletionTasks.patientRecordId, patientRecordId)).orderBy(desc(recordCompletionTasks.updatedAt)).limit(1))[0];
  await db.insert(registryAuditLogs).values({ patientRecordId, actorUserId: assignedByAdminId, action: "updated", fieldSummary: eventType === "assigned" ? "Record-completion task assigned" : "Record-completion task reassigned" });
  await createAdministratorTaskNotifications(db, { taskId: task.id, eventType });
  return task;
}

export type CompletionTaskListInput = { status?: "action_required" | "accepted" | "completed"; search?: string; sort: "attention_first" | "updated_desc" | "updated_asc" | "status"; page: number; pageSize: number };

function taskListOrder(sort: CompletionTaskListInput["sort"]) {
  const statusOrder = sql<number>`CASE ${recordCompletionTasks.status} WHEN 'assigned' THEN 0 WHEN 'reassigned' THEN 0 WHEN 'accepted' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END`;
  if (sort === "updated_asc") return [asc(recordCompletionTasks.updatedAt), asc(recordCompletionTasks.id)];
  if (sort === "updated_desc") return [desc(recordCompletionTasks.updatedAt), asc(recordCompletionTasks.id)];
  return [asc(statusOrder), desc(recordCompletionTasks.updatedAt), asc(recordCompletionTasks.id)];
}

function taskListStatusCondition(status: CompletionTaskListInput["status"]) {
  if (status === "action_required") return sqlOr(eq(recordCompletionTasks.status, "assigned"), eq(recordCompletionTasks.status, "reassigned"));
  if (status) return eq(recordCompletionTasks.status, status);
  return undefined;
}

function taskListSearchCondition(search: CompletionTaskListInput["search"]) {
  if (!search) return undefined;
  if (search === "awaiting acceptance") return sqlOr(eq(recordCompletionTasks.status, "assigned"), eq(recordCompletionTasks.status, "reassigned"));
  if (["assigned", "reassigned", "accepted", "completed"].includes(search)) return eq(recordCompletionTasks.status, search as "assigned" | "reassigned" | "accepted" | "completed");
  const start = new Date(`${search}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return sqlAnd(gte(recordCompletionTasks.updatedAt, start), lt(recordCompletionTasks.updatedAt, end));
}

export async function listMyRecordCompletionTasks(userId: number, input: CompletionTaskListInput) {
  const db = requireDb(await getDb());
  const conditions = [eq(recordCompletionTasks.assignedToUserId, userId), taskListStatusCondition(input.status), taskListSearchCondition(input.search)].filter(Boolean);
  const where = sqlAnd(...conditions);
  const totalRows = await db.select({ total: count() }).from(recordCompletionTasks).where(where);
  const totalItems = Number(totalRows[0]?.total ?? 0);
  const page = totalItems ? Math.min(input.page, Math.ceil(totalItems / input.pageSize)) : 1;
  const items = await db.select({ id: recordCompletionTasks.id, patientRecordId: recordCompletionTasks.patientRecordId, cohort: patientRecords.cohort, status: recordCompletionTasks.status, assignedToUserId: recordCompletionTasks.assignedToUserId, createdAt: recordCompletionTasks.createdAt, acceptedAt: recordCompletionTasks.acceptedAt, completedAt: recordCompletionTasks.completedAt, updatedAt: recordCompletionTasks.updatedAt }).from(recordCompletionTasks).innerJoin(patientRecords, eq(recordCompletionTasks.patientRecordId, patientRecords.id)).where(where).orderBy(...taskListOrder(input.sort)).limit(input.pageSize).offset((page - 1) * input.pageSize);
  return { items, totalItems, page, pageSize: input.pageSize };
}

export async function listAllRecordCompletionTasks(input: CompletionTaskListInput) {
  const db = requireDb(await getDb());
  const conditions = [taskListStatusCondition(input.status), taskListSearchCondition(input.search)].filter(Boolean);
  const where = conditions.length ? sqlAnd(...conditions) : undefined;
  const totalRows = await db.select({ total: count() }).from(recordCompletionTasks).where(where);
  const totalItems = Number(totalRows[0]?.total ?? 0);
  const page = totalItems ? Math.min(input.page, Math.ceil(totalItems / input.pageSize)) : 1;
  const items = await db.select({ id: recordCompletionTasks.id, patientRecordId: recordCompletionTasks.patientRecordId, cohort: patientRecords.cohort, status: recordCompletionTasks.status, assignedToUserId: recordCompletionTasks.assignedToUserId, assigneeName: users.name, createdAt: recordCompletionTasks.createdAt, acceptedAt: recordCompletionTasks.acceptedAt, completedAt: recordCompletionTasks.completedAt, updatedAt: recordCompletionTasks.updatedAt }).from(recordCompletionTasks).innerJoin(patientRecords, eq(recordCompletionTasks.patientRecordId, patientRecords.id)).leftJoin(users, eq(recordCompletionTasks.assignedToUserId, users.id)).where(where).orderBy(...taskListOrder(input.sort)).limit(input.pageSize).offset((page - 1) * input.pageSize);
  return { items, totalItems, page, pageSize: input.pageSize };
}

export async function listRecordCompletionTaskExportRows(userId: number, isAdmin: boolean, input: Pick<CompletionTaskListInput, "status" | "search" | "sort">) {
  const db = requireDb(await getDb());
  const conditions = [isAdmin ? undefined : eq(recordCompletionTasks.assignedToUserId, userId), taskListStatusCondition(input.status), taskListSearchCondition(input.search)].filter(Boolean);
  const where = conditions.length ? sqlAnd(...conditions) : undefined;
  return db.select({ status: recordCompletionTasks.status, updatedAt: recordCompletionTasks.updatedAt }).from(recordCompletionTasks).where(where).orderBy(...taskListOrder(input.sort)).limit(10_000);
}

async function changeTaskStatus(taskId: number, actorUserId: number, status: "accepted" | "completed") {
  const db = requireDb(await getDb());
  const task = (await db.select().from(recordCompletionTasks).where(eq(recordCompletionTasks.id, taskId)).limit(1))[0];
  if (!task) throw new Error("Completion task not found.");
  const transitionError = getTaskTransitionError(task.status, task.assignedToUserId, actorUserId, status);
  if (transitionError) throw new Error(transitionError);
  const now = new Date();
  await db.update(recordCompletionTasks).set(status === "accepted" ? { status, acceptedAt: now } : { status, completedAt: now }).where(eq(recordCompletionTasks.id, taskId));
  await db.insert(registryAuditLogs).values({ patientRecordId: task.patientRecordId, actorUserId, action: "updated", fieldSummary: status === "accepted" ? "Record-completion task accepted" : "Record-completion task completed" });
  await createAdministratorTaskNotifications(db, { taskId, eventType: status });
  return (await db.select().from(recordCompletionTasks).where(eq(recordCompletionTasks.id, taskId)).limit(1))[0];
}

export function acceptRecordCompletionTask(taskId: number, actorUserId: number) { return changeTaskStatus(taskId, actorUserId, "accepted"); }
export function completeRecordCompletionTask(taskId: number, actorUserId: number) { return changeTaskStatus(taskId, actorUserId, "completed"); }

export async function listAdministratorTaskNotifications(userId: number) {
  const db = requireDb(await getDb());
  return db.select({ id: administratorNotifications.id, eventType: administratorNotifications.eventType, createdAt: administratorNotifications.createdAt, readAt: administratorNotifications.readAt }).from(administratorNotifications).where(eq(administratorNotifications.recipientUserId, userId)).orderBy(desc(administratorNotifications.createdAt)).limit(50);
}

export async function markAdministratorTaskNotificationsRead(userId: number) {
  const db = requireDb(await getDb());
  await db.update(administratorNotifications).set({ readAt: new Date() }).where(sqlAnd(eq(administratorNotifications.recipientUserId, userId), isNull(administratorNotifications.readAt)));
  return { success: true } as const;
}

export async function listResearchFiles(patientRecordId: number) {
  const db = requireDb(await getDb());
  const result = await db.select({ researchFiles: patientRecords.researchFiles }).from(patientRecords).where(eq(patientRecords.id, patientRecordId)).limit(1);
  return (result[0]?.researchFiles as ResearchFile[] | null | undefined) ?? [];
}

export async function logAccessChange(actorUserId: number, targetUserId: number, accessStatus: string) {
  const db = requireDb(await getDb());
  await db.insert(registryAuditLogs).values({ actorUserId, action: "access_changed", fieldSummary: `Access status for user ${targetUserId} changed to ${accessStatus}` });
}

export async function logRoleChange(actorUserId: number, targetUserId: number, role: "user" | "admin") {
  const db = requireDb(await getDb());
  await db.insert(registryAuditLogs).values({ actorUserId, action: "access_changed", fieldSummary: `Administrator role for user ${targetUserId} changed to ${role}` });
}

export async function logProjectAccountRemoval(actorUserId: number, targetUserId: number) {
  const db = requireDb(await getDb());
  await db.insert(registryAuditLogs).values({ actorUserId, action: "access_changed", fieldSummary: `Project account ${targetUserId} removed from active access list` });
}

async function requireApprovedMessageRecipient(db: any, recipientUserId: number) {
  const recipient = await db.select({ id: users.id, accessStatus: users.accessStatus }).from(users).where(eq(users.id, recipientUserId)).limit(1);
  if (!recipient[0] || recipient[0].accessStatus !== "approved") throw new Error("Messages can be sent only to approved registry users.");
}

export async function isApprovedMessageRecipient(recipientUserId: number) {
  const db = requireDb(await getDb());
  const recipient = await db.select({ id: users.id, accessStatus: users.accessStatus }).from(users).where(eq(users.id, recipientUserId)).limit(1);
  return Boolean(recipient[0] && recipient[0].accessStatus === "approved");
}

export async function listApprovedMessageRecipients(actorUserId: number) {
  const db = requireDb(await getDb());
  const recipients = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(eq(users.accessStatus, "approved")).orderBy(users.name);
  return recipients.filter(recipient => recipient.id !== actorUserId);
}

export async function listDirectMessages(actorUserId: number, recipientUserId: number) {
  const db = requireDb(await getDb());
  await requireApprovedMessageRecipient(db, recipientUserId);
  return db.select({ id: userMessages.id, senderUserId: userMessages.senderUserId, recipientUserId: userMessages.recipientUserId, body: userMessages.body, createdAt: userMessages.createdAt, senderName: users.name }).from(userMessages).leftJoin(users, eq(userMessages.senderUserId, users.id)).where(sqlOr(sqlAnd(eq(userMessages.senderUserId, actorUserId), eq(userMessages.recipientUserId, recipientUserId)), sqlAnd(eq(userMessages.senderUserId, recipientUserId), eq(userMessages.recipientUserId, actorUserId)))).orderBy(userMessages.createdAt);
}

export async function sendDirectMessage(senderUserId: number, recipientUserId: number, body: string) {
  const db = requireDb(await getDb());
  await requireApprovedMessageRecipient(db, recipientUserId);
  await db.insert(userMessages).values({ senderUserId, recipientUserId, body });
  const created = await db.select().from(userMessages).where(sqlAnd(eq(userMessages.senderUserId, senderUserId), eq(userMessages.recipientUserId, recipientUserId), eq(userMessages.body, body))).orderBy(desc(userMessages.createdAt)).limit(1);
  return created[0];
}
