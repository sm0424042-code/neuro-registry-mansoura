import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { patientInputSchema, patientUpdateSchema, registryFiltersSchema, researchFileInputSchema, toDeidentifiedExportRow } from "./registry";

const approvedProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.accessStatus !== "approved") {
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

const directMessageInputSchema = z.object({
  recipientUserId: z.number().int().positive(),
  body: z.string().trim().min(1).max(1000).refine(value => !/\b(MUNR-[A-Z0-9]{4,16}|national\s*id|patient\s*(?:name|phone|mobile)|phone\s*number|mobile\s*number)\b/i.test(value), "Messages must not include research IDs, national IDs, patient names, or phone numbers."),
});

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
  registry: router({
    overview: approvedProcedure.query(() => db.getRegistryOverview()),
    list: approvedProcedure.input(registryFiltersSchema).query(({ input }) => db.listPatientRecords(input)),
    get: approvedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getPatientRecord(input.id)),
    auditTrail: approvedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.getPatientAuditTrail(input.id)),
    assignableUsers: approvedProcedure.query(() => db.listAssignableUsers()),
    create: approvedProcedure.input(patientInputSchema).mutation(({ input, ctx }) => db.createPatientRecord(input, ctx.user.id)),
    update: approvedProcedure.input(patientUpdateSchema).mutation(({ input, ctx }) => {
      const { id, ...record } = input;
      return db.updatePatientRecord(id, record, ctx.user.id);
    }),
    files: approvedProcedure.input(z.object({ patientRecordId: z.number().int().positive() })).query(({ input }) => db.listResearchFiles(input.patientRecordId)),
    downloadFile: approvedProcedure.input(z.object({ patientRecordId: z.number().int().positive(), storageKey: z.string().trim().min(1).max(300) })).query(({ input }) => db.getResearchFileUrl(input.patientRecordId, input.storageKey)),
    uploadFile: approvedProcedure.input(researchFileInputSchema).mutation(async ({ input, ctx }) => {
      const content = Buffer.from(input.contentBase64, "base64");
      if (content.byteLength !== input.sizeBytes) throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file size could not be verified." });
      return db.appendResearchFile(input.patientRecordId, ctx.user.id, { fileName: input.fileName, mimeType: input.mimeType, sizeBytes: input.sizeBytes, category: input.category, content });
    }),
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
  administration: router({
    users: adminProcedure.query(() => db.listUsersForAdmin()),
    setAccess: adminProcedure.input(z.object({ userId: z.number().int().positive(), accessStatus: z.enum(["pending", "approved", "suspended"]) })).mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id && input.accessStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Administrators cannot remove their own access." });
      }
      await db.setUserAccessStatus(input.userId, input.accessStatus);
      await db.logAccessChange(ctx.user.id, input.userId, input.accessStatus);
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
