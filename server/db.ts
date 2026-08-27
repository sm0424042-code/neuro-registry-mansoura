import { and, asc, count, desc, eq, gte, like, lte, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { and as sqlAnd, isNull, or as sqlOr } from "drizzle-orm";
import { administratorNotifications, InsertUser, patientRecords, recordCompletionTasks, registryAuditLogs, userMessages, userProfiles, users } from "../drizzle/schema";
import type { CohortClinicalData, ImmuneTherapy, LaboratoryInvestigation, MultipleSclerosisDoseAdherence, NeurologicalInvestigation, PatientFollowUp, ProtocolInvestigation, RadiologicalInvestigation, ResearchFile } from "../drizzle/schema";
import { storageGetSignedUrl, storagePut } from "./storage";
import { ENV } from "./_core/env";
import type { z } from "zod";
import { getInvestigationCoverage, getPatientUpdateAuditSummary } from "./registry";
import type { patientInputSchema, registryFiltersSchema } from "./registry";

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

export async function listMyRecordCompletionTasks(userId: number) {
  const db = requireDb(await getDb());
  return db.select({ id: recordCompletionTasks.id, patientRecordId: recordCompletionTasks.patientRecordId, cohort: patientRecords.cohort, status: recordCompletionTasks.status, assignedToUserId: recordCompletionTasks.assignedToUserId, createdAt: recordCompletionTasks.createdAt, acceptedAt: recordCompletionTasks.acceptedAt, completedAt: recordCompletionTasks.completedAt, updatedAt: recordCompletionTasks.updatedAt }).from(recordCompletionTasks).innerJoin(patientRecords, eq(recordCompletionTasks.patientRecordId, patientRecords.id)).where(eq(recordCompletionTasks.assignedToUserId, userId)).orderBy(desc(recordCompletionTasks.updatedAt));
}

export async function listAllRecordCompletionTasks() {
  const db = requireDb(await getDb());
  return db.select({ id: recordCompletionTasks.id, patientRecordId: recordCompletionTasks.patientRecordId, cohort: patientRecords.cohort, status: recordCompletionTasks.status, assignedToUserId: recordCompletionTasks.assignedToUserId, assigneeName: users.name, createdAt: recordCompletionTasks.createdAt, acceptedAt: recordCompletionTasks.acceptedAt, completedAt: recordCompletionTasks.completedAt, updatedAt: recordCompletionTasks.updatedAt }).from(recordCompletionTasks).innerJoin(patientRecords, eq(recordCompletionTasks.patientRecordId, patientRecords.id)).leftJoin(users, eq(recordCompletionTasks.assignedToUserId, users.id)).orderBy(desc(recordCompletionTasks.updatedAt));
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
