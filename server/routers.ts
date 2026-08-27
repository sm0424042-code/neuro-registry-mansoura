import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import * as notifications from "./_core/notification";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { ENV } from "./_core/env";
import { getCompleteRecordThresholdError, patientInputSchema, patientUpdateSchema, registryFiltersSchema, researchFileInputSchema, toDeidentifiedExportRow } from "./registry";

const approvedProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.accessStatus !== "approved" || ctx.user.removedAt) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your registry access has not been approved." });
  }
  return next({ ctx });
});

const adminProcedure = approvedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  }
  return next({ ctx });
});

const directIdentifierPattern = /\bMUNR-[A-Z0-9]{4,32}\b|\bpatient\b|\bnational\s*id\b|\b(?:medical\s*record|hospital|file)\s*(?:number|no\.?|id)\b|\b(?:phone|mobile|telephone|contact)\s*(?:number|no\.?)\b|\b(?:home|postal|residential)?\s*address\b|\b(?:date\s*of\s*birth|birth\s*date|dob)\b|\b(?:mrn|nhs\s*number)\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b\d{14}\b|(?:\+?20|0)?1[0125]\d{8}|اسم\s*المريض|(?:المريض|مريض|المرضى)|رقم\s*(?:الهاتف|التليفون|الجوال|المحمول|الهوية|البطاقة|الملف|المستشفى|السجل\s*الطبي)|الرقم\s*القومي|عنوان(?:\s*المريض)?|تاريخ\s*الميلاد|(?:البريد\s*الإلكتروني|ايميل)/i;

const directMessageInputSchema = z.object({
  recipientUserId: z.number().int().positive(),
  body: z.string().trim().min(1).max(1000).refine(value => !directIdentifierPattern.test(value), "Messages must not include Research IDs, patient information, contact details, national or medical-record numbers, addresses, dates of birth, or email addresses."),
});

const HOMEPAGE_IMAGE_REPORT_COOLDOWN_MS = 5 * 60 * 1000;
const homepageImageReportTimes = new Map<number, number>();
const HOMEPAGE_IMAGE_REPORT_TITLE = "Broken homepage image reported";
const HOMEPAGE_IMAGE_REPORT_CONTENT = "A registered user reported that the static abstract homepage hero image could not be loaded. No patient, record, user, or clinical data was included.";
const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const TASK_OWNER_ALERTS = {
  assigned: { title: "Registry task assigned", content: "A protected record-completion task was assigned. No patient, record, or clinical information is included." },
  reassigned: { title: "Registry task reassigned", content: "A protected record-completion task was reassigned. No patient, record, or clinical information is included." },
  accepted: { title: "Registry task accepted", content: "A protected record-completion task was accepted by its assigned member. No patient, record, or clinical information is included." },
  completed: { title: "Registry task completed", content: "A protected record-completion task was marked complete by its assigned member. No patient, record, or clinical information is included." },
  record_completion_changed: { title: "Registry completion status changed", content: "A protected record-completion status changed. No patient, record, or clinical information is included." },
} as const;

async function notifyOwnerOfTaskEvent(eventType: keyof typeof TASK_OWNER_ALERTS) {
  try {
    return await notifications.notifyOwner(TASK_OWNER_ALERTS[eventType]);
  } catch {
    console.warn(`Owner alert delivery did not complete for task event: ${eventType}`);
    return false;
  }
}
const profileAvatarInputSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(PROFILE_AVATAR_MAX_BYTES),
  contentBase64: z.string().min(8).max(3 * 1024 * 1024).regex(/^[A-Za-z0-9+/]+={0,2}$/, "The image payload is not valid base64."),
});

function hasExpectedAvatarSignature(content: Buffer, mimeType: "image/jpeg" | "image/png" | "image/webp") {
  if (mimeType === "image/jpeg") return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  if (mimeType === "image/png") return content.length >= 8 && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return content.length >= 12 && content.subarray(0, 4).toString("ascii") === "RIFF" && content.subarray(8, 12).toString("ascii") === "WEBP";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    avatar: approvedProcedure.query(({ ctx }) => db.getOwnProfileAvatar(ctx.user.id)),
    replaceAvatar: approvedProcedure.input(profileAvatarInputSchema).mutation(async ({ input, ctx }) => {
      const content = Buffer.from(input.contentBase64, "base64");
      if (content.byteLength !== input.sizeBytes) throw new TRPCError({ code: "BAD_REQUEST", message: "The image size could not be verified." });
      if (!hasExpectedAvatarSignature(content, input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The image content does not match its declared format." });
      return db.replaceOwnProfileAvatar(ctx.user.id, { content, mimeType: input.mimeType });
    }),
  }),
  registry: router({
    overview: approvedProcedure.query(() => db.getRegistryOverview()),
    list: approvedProcedure.input(registryFiltersSchema).query(({ input }) => db.listPatientRecords(input)),
    get: approvedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getPatientRecord(input.id)),
    auditTrail: approvedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getPatientAuditTrail(input.id)),
    assignableUsers: approvedProcedure.query(() => db.listAssignableUsers()),
    create: approvedProcedure.input(patientInputSchema).mutation(({ input, ctx }) => { const error = getCompleteRecordThresholdError(input); if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error }); return db.createPatientRecord(input, ctx.user.id); }),
    update: approvedProcedure.input(patientUpdateSchema).mutation(async ({ input, ctx }) => {
      const error = getCompleteRecordThresholdError(input);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error });
      const { id, ...record } = input;
      const existing = await db.getPatientRecord(id);
      const updated = await db.updatePatientRecord(id, record, ctx.user.id);
      if (existing && existing.completenessStatus !== updated.completenessStatus) await notifyOwnerOfTaskEvent("record_completion_changed");
      return updated;
    }),
    files: approvedProcedure.input(z.object({ patientRecordId: z.number().int().positive() })).query(({ input }) => db.listResearchFiles(input.patientRecordId)),
    downloadFile: approvedProcedure.input(z.object({ patientRecordId: z.number().int().positive(), storageKey: z.string().trim().min(1).max(300) })).query(({ input }) => db.getResearchFileUrl(input.patientRecordId, input.storageKey)),
    uploadFile: approvedProcedure.input(researchFileInputSchema).mutation(async ({ input, ctx }) => {
      const content = Buffer.from(input.contentBase64, "base64");
      if (content.byteLength !== input.sizeBytes) throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file size could not be verified." });
      return db.appendResearchFile(input.patientRecordId, ctx.user.id, { fileName: input.fileName, mimeType: input.mimeType, sizeBytes: input.sizeBytes, category: input.category, content });
    }),
  }),
  completionTasks: router({
    mine: approvedProcedure.query(({ ctx }) => db.listMyRecordCompletionTasks(ctx.user.id)),
    all: adminProcedure.query(() => db.listAllRecordCompletionTasks()),
    assign: adminProcedure.input(z.object({ patientRecordId: z.number().int().positive(), assignedToUserId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const assignee = await db.getUserAdministrationState(input.assignedToUserId);
      if (!assignee || assignee.removedAt || assignee.accessStatus !== "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an approved active registry member." });
      const task = await db.assignRecordCompletionTask(input.patientRecordId, input.assignedToUserId, ctx.user.id);
      await notifyOwnerOfTaskEvent(task.status === "reassigned" ? "reassigned" : "assigned");
      return task;
    }),
    accept: approvedProcedure.input(z.object({ taskId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const task = await db.acceptRecordCompletionTask(input.taskId, ctx.user.id);
      await notifyOwnerOfTaskEvent("accepted");
      return task;
    }),
    complete: approvedProcedure.input(z.object({ taskId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const task = await db.completeRecordCompletionTask(input.taskId, ctx.user.id);
      await notifyOwnerOfTaskEvent("completed");
      return task;
    }),
    notifications: adminProcedure.query(({ ctx }) => db.listAdministratorTaskNotifications(ctx.user.id)),
    markNotificationsRead: adminProcedure.mutation(({ ctx }) => db.markAdministratorTaskNotificationsRead(ctx.user.id)),
  }),
  messages: router({
    recipients: approvedProcedure.query(({ ctx }) => db.listApprovedMessageRecipients(ctx.user.id)),
    thread: approvedProcedure.input(z.object({ recipientUserId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      if (input.recipientUserId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose another approved user to start a conversation." });
      if (!await db.isApprovedMessageRecipient(input.recipientUserId)) throw new TRPCError({ code: "FORBIDDEN", message: "Messages are available only with approved registry users." });
      return db.listDirectMessages(ctx.user.id, input.recipientUserId);
    }),
    send: approvedProcedure.input(directMessageInputSchema).mutation(async ({ input, ctx }) => {
      if (input.recipientUserId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot send a message to yourself." });
      if (!await db.isApprovedMessageRecipient(input.recipientUserId)) throw new TRPCError({ code: "FORBIDDEN", message: "Messages are available only with approved registry users." });
      return db.sendDirectMessage(ctx.user.id, input.recipientUserId, input.body);
    }),
  }),
  mediaReports: router({
    reportBrokenHomepageHeroImage: approvedProcedure.mutation(async ({ ctx }) => {
      const now = Date.now();
      const lastReportedAt = homepageImageReportTimes.get(ctx.user.id);
      if (lastReportedAt && now - lastReportedAt < HOMEPAGE_IMAGE_REPORT_COOLDOWN_MS) {
        return { success: true, alreadyReported: true } as const;
      }

      const delivered = await notifications.notifyOwner({ title: HOMEPAGE_IMAGE_REPORT_TITLE, content: HOMEPAGE_IMAGE_REPORT_CONTENT });
      if (delivered) homepageImageReportTimes.set(ctx.user.id, now);
      return { success: delivered, alreadyReported: false } as const;
    }),
  }),
  administration: router({
    users: adminProcedure.query(() => db.listUsersForAdmin()),
    setAccess: adminProcedure.input(z.object({ userId: z.number().int().positive(), accessStatus: z.enum(["pending", "approved", "suspended"]) })).mutation(async ({ input, ctx }) => {
      const target = await db.getUserAdministrationState(input.userId);
      if (!target || target.removedAt) throw new TRPCError({ code: "NOT_FOUND", message: "The selected active project account no longer exists." });
      if (target.openId === ENV.ownerOpenId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The configured owner account cannot have its registry access changed here." });
      }
      if (input.userId === ctx.user.id && input.accessStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Administrators cannot remove their own access." });
      }
      await db.setUserAccessStatus(input.userId, input.accessStatus);
      await db.logAccessChange(ctx.user.id, input.userId, input.accessStatus);
      return { success: true } as const;
    }),
    setRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) })).mutation(async ({ input, ctx }) => {
      const target = await db.getUserAdministrationState(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "The selected user no longer exists." });
      if (target.removedAt) throw new TRPCError({ code: "NOT_FOUND", message: "The selected active project account no longer exists." });
      if (target.openId === ENV.ownerOpenId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The configured owner account cannot have its role changed here." });
      }
      if (input.role === "admin" && target.accessStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Approve an OAuth account before granting administrator access." });
      }
      if (input.role !== "admin" && (target.id === ctx.user.id || target.openId === ENV.ownerOpenId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The current or configured owner administrator cannot be demoted here." });
      }
      await db.setUserRole(target.id, input.role);
      await db.logRoleChange(ctx.user.id, target.id, input.role);
      return { success: true } as const;
    }),
    removeProjectAccount: adminProcedure.input(z.object({ userId: z.number().int().positive(), confirmed: z.literal(true) })).mutation(async ({ input, ctx }) => {
      const target = await db.getUserAdministrationState(input.userId);
      if (!target || target.removedAt) throw new TRPCError({ code: "NOT_FOUND", message: "The selected active project account no longer exists." });
      if (target.id === ctx.user.id || target.openId === ENV.ownerOpenId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The current or configured owner administrator cannot be removed here." });
      }
      await db.removeUserFromRegistry(target.id, ctx.user.id);
      await db.logProjectAccountRemoval(ctx.user.id, target.id);
      return { success: true } as const;
    }),
    exportDeidentified: adminProcedure.mutation(async ({ ctx }) => {
      const records = await db.getResearchExportRecords();
      const rows = records.map(toDeidentifiedExportRow);
      await db.logResearchExport(ctx.user.id, rows.length);
      return rows;
    }),
  }),
});

export type AppRouter = typeof appRouter;
