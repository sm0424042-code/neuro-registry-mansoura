import { describe, expect, it, vi } from "vitest";
import type { PatientRecord } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getPatientUpdateAuditSummary, laboratoryInvestigationSchema, neurologicalInvestigationSchema, patientFollowUpSchema, patientInputSchema, radiologicalInvestigationSchema, registryFiltersSchema, researchFileInputSchema, toAgeBand, toDeidentifiedExportRow } from "./registry";
import { appRouter } from "./routers";
import * as db from "./db";
import { updatePatientRecordWithDb } from "./db";

function createContext(role: "admin" | "user", accessStatus: "pending" | "approved" | "suspended"): TrpcContext {
  return {
    user: { id: 14, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role, accessStatus, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("registry validation", () => {
  it("rejects clinical data that does not match the selected cohort", () => {
    const result = patientInputSchema.safeParse({
      researchId: "EGR-2026A", cohort: "stroke", sex: "female", ageAtEnrollment: 42, ageAtOnset: 41,
      consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "active", primaryDiagnosis: "Ischemic stroke", dataQualityStatus: "complete",
      clinicalData: { cohort: "multiple_sclerosis", diseaseCourse: "relapsing_remitting", disabilityLevel: "mild", relapseActivity: "inactive", diseaseModifyingTherapy: "yes" },
      radiologicalInvestigations: [], laboratoryInvestigations: [], neurologicalInvestigations: [], followUpVisits: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid patient payload for each requested neurological cohort", () => {
    const base = { sex: "not_recorded", ageAtEnrollment: 50, ageAtOnset: 48, consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "active", primaryDiagnosis: "Research diagnosis", dataQualityStatus: "draft", radiologicalInvestigations: [], laboratoryInvestigations: [], neurologicalInvestigations: [], followUpVisits: [] } as const;
    const cases = [
      ["stroke", { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "anterior", reperfusionTherapy: "none", toastEtiology: "unknown" }],
      ["multiple-sclerosis", { cohort: "multiple_sclerosis", diseaseCourse: "relapsing_remitting", disabilityLevel: "mild", relapseActivity: "inactive", diseaseModifyingTherapy: "yes" }],
      ["abnormal-movements", { cohort: "abnormal_movements", movementPhenotype: "tremor", distribution: "focal", severity: "mild", functionalImpact: "mild", treatmentResponse: "responsive" }],
      ["gbs-case", { cohort: "guillain_barre", variant: "aidp", disabilityScore: "2", ventilatorySupport: "none", treatment: "ivig" }],
      ["mg-case", { cohort: "myasthenia_gravis", mgfaClass: "II", antibodyStatus: "achr", thymomaStatus: "absent", crisisHistory: "never", treatmentResponse: "responsive" }],
      ["myelopathy", { cohort: "myelopathy", level: "cervical", cause: "degenerative", upperMotorNeuronSigns: "present", lowerMotorNeuronFeatures: "absent", bladderInvolvement: "no" }],
      ["neuro-ophthalmology", { cohort: "neuro_ophthalmology", visualSyndrome: "optic_neuritis", laterality: "right", acuityChange: "stable", afferentDefect: "yes", specialistAssessment: "probable" }],
    ] as const;
    for (const [suffix, clinicalData] of cases) {
      const result = patientInputSchema.safeParse({ ...base, researchId: `EGR-${suffix.replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase()}`, cohort: clinicalData.cohort, clinicalData });
      expect(result.success, suffix).toBe(true);
    }
  });

  it("accepts only a pseudonymised Research ID format", () => {
    expect(patientInputSchema.shape.researchId.safeParse("EGR-2026A").success).toBe(true);
    expect(patientInputSchema.shape.researchId.safeParse("EGR-AB12").success).toBe(true);
    expect(patientInputSchema.shape.researchId.safeParse("Ahmed-MRN-12345").success).toBe(false);
    expect(patientInputSchema.shape.researchId.safeParse("EGR-12").success).toBe(false);
  });

  it("converts exact ages into disclosure-reducing age bands", () => {
    expect(toAgeBand(18)).toBe("18-29");
    expect(toAgeBand(84)).toBe("80+");
  });

  it("accepts combined registry query filters for supported research dimensions", () => {
    const filters = registryFiltersSchema.parse({ cohort: "stroke", enrollmentStatus: "enrolled", clinicalStatus: "active", dataQualityStatus: "complete", search: "EGR-20", ageMin: 18, ageMax: 80 });
    expect(filters).toMatchObject({ cohort: "stroke", enrollmentStatus: "enrolled", clinicalStatus: "active", dataQualityStatus: "complete", ageMin: 18, ageMax: 80 });
  });

  it("excludes direct and operational identifiers from a research export row", () => {
    const row = toDeidentifiedExportRow({
      id: 7, researchId: "EGR-2026A", cohort: "stroke", sex: "male", ageAtEnrollment: 64, ageAtOnset: 63,
      consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "active", primaryDiagnosis: "Ischemic stroke", dataQualityStatus: "complete",
      clinicalData: { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "anterior", nihssAtPresentation: 5, mRsAtDischarge: 1, reperfusionTherapy: "iv_thrombolysis", toastEtiology: "cardioembolic" },
      radiologicalInvestigations: [{ modality: "mri", bodyRegion: "brain", keyFinding: "No acute lesion", lesionStatus: "absent", reportReference: "RAD-2026-001" }], laboratoryInvestigations: [{ testName: "thyroid_function", resultStatus: "normal", resultSummary: "Within reference range" }], neurologicalInvestigations: [{ testName: "emg_ncs", resultStatus: "not_done", lowerMotorNeuronRelevant: false }], followUpVisits: [{ visitType: "baseline", followUpStatus: "completed", outcome: "stable", assessmentSummary: "Baseline assessment", timepoint: "baseline" }], researchFiles: [], createdByUserId: 1, lastModifiedByUserId: 2, createdAt: new Date(), updatedAt: new Date(),
    } as PatientRecord);
    expect(row).toMatchObject({ research_id: "EGR-2026A", age_band_at_enrollment: "60-69", stroke_type: "ischemic" });
    expect(row).not.toHaveProperty("id");
    expect(row).not.toHaveProperty("sex");
    expect(row).not.toHaveProperty("createdByUserId");
    expect(row).not.toHaveProperty("createdAt");
    expect(row.radiological_investigations).toEqual([{ modality: "mri", body_region: "brain", key_finding: "No acute lesion", lesion_status: "absent" }]);
    expect(row.laboratory_investigations).toEqual([{ testName: "thyroid_function", resultStatus: "normal", resultSummary: "Within reference range" }]);
    expect(row.neurological_investigations).toEqual([{ testName: "emg_ncs", resultStatus: "not_done", lowerMotorNeuronRelevant: false }]);
    expect(row.follow_up_visits).toEqual([{ visitType: "baseline", followUpStatus: "completed", outcome: "stable", assessmentSummary: "Baseline assessment", timepoint: "baseline" }]);
    expect(row).not.toHaveProperty("research_files");
    expect(row).not.toHaveProperty("createdByUserId");
  });

  it("validates laboratory, neurological, follow-up, and secure file investigation data", () => {
    expect(laboratoryInvestigationSchema.safeParse({ testName: "thyroid_function", resultStatus: "normal", resultSummary: "Within reference range" }).success).toBe(true);
    expect(laboratoryInvestigationSchema.safeParse({ testName: "uric_acid", resultStatus: "abnormal", resultSummary: "Raised" }).success).toBe(true);
    expect(neurologicalInvestigationSchema.safeParse({ testName: "emg_ncs", resultStatus: "abnormal", lowerMotorNeuronRelevant: true }).success).toBe(true);
    expect(neurologicalInvestigationSchema.safeParse({ testName: "csf_analysis", resultStatus: "not_done" }).success).toBe(true);
    expect(neurologicalInvestigationSchema.safeParse({ testName: "fundus_examination", resultStatus: "normal" }).success).toBe(true);
    expect(patientFollowUpSchema.safeParse({ visitType: "routine", followUpStatus: "completed", outcome: "stable", assessmentSummary: "Stable at follow-up", timepoint: "3_months" }).success).toBe(true);
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 1024, category: "radiology_report", contentBase64: "YWJjZA==" }).success).toBe(true);
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "patient-name.pdf", mimeType: "application/pdf", sizeBytes: 1024, category: "radiology_report", contentBase64: "YWJjZA==" }).success).toBe(false);
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "RAD-2026-001.exe", mimeType: "application/x-msdownload", sizeBytes: 4, category: "other", contentBase64: "YWJjZA==" }).success).toBe(false);
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 15 * 1024 * 1024 + 1, category: "radiology_report", contentBase64: "YWJjZA==" }).success).toBe(false);
  });

  it("writes a follow-up audit event during an isolated patient update", async () => {
    const auditRows: unknown[] = [];
    let selectCount = 0;
    const fakeDb: any = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => { selectCount += 1; return selectCount === 1 ? [{ id: 7 }] : [{ id: 7, researchId: "EGR-FOLLOW" }]; } }) }) }),
      update: () => ({ set: () => ({ where: async () => undefined }) }),
      insert: () => ({ values: async (row: unknown) => { auditRows.push(row); } }),
    };
    const input: any = { researchId: "EGR-FOLLOW", cohort: "stroke", sex: "not_recorded", ageAtEnrollment: 50, ageAtOnset: 48, consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "follow_up", primaryDiagnosis: "Research diagnosis", dataQualityStatus: "complete", clinicalData: { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "anterior", reperfusionTherapy: "none", toastEtiology: "unknown" }, radiologicalInvestigations: [], laboratoryInvestigations: [], neurologicalInvestigations: [], followUpVisits: [{ visitType: "routine", followUpStatus: "completed", outcome: "stable", assessmentSummary: "Stable at follow-up", timepoint: "3_months" }] };
    await updatePatientRecordWithDb(fakeDb, 7, input, 14);
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({ patientRecordId: 7, actorUserId: 14, action: "updated", fieldSummary: "Core record, patient follow-up updated" });
  });

  it("creates a specific audit summary when follow-up data changes", () => {
    expect(getPatientUpdateAuditSummary({ followUpVisits: [{ timepoint: "3_months" }], laboratoryInvestigations: [], neurologicalInvestigations: [] })).toBe("Core record, patient follow-up updated");
    expect(getPatientUpdateAuditSummary({ followUpVisits: [{ timepoint: "3_months" }], laboratoryInvestigations: [{ testName: "thyroid_function" }], neurologicalInvestigations: [{ testName: "emg_ncs" }] })).toContain("patient follow-up");
  });

  it("validates radiological investigations without allowing identifying report references", () => {
    expect(radiologicalInvestigationSchema.safeParse({ modality: "mri", bodyRegion: "brain", keyFinding: "Focal lesion", lesionStatus: "present", reportReference: "RAD-2026-001" }).success).toBe(true);
    expect(radiologicalInvestigationSchema.safeParse({ modality: "mri", bodyRegion: "brain", keyFinding: "Focal lesion", lesionStatus: "present", reportReference: "MRN-12345" }).success).toBe(false);
  });

  it("protects file upload procedures and accepts an approved upload", async () => {
    const pendingCaller = appRouter.createCaller(createContext("user", "pending"));
    await expect(pendingCaller.registry.uploadFile({ patientRecordId: 1, fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 4, category: "radiology_report", contentBase64: "YWJjZA==" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const append = vi.spyOn(db, "appendResearchFile").mockResolvedValue({ storageKey: "research-files/1/RAD-2026-001.pdf", fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 4, category: "radiology_report", uploadedAt: new Date(), url: "https://example.invalid/file" });
    try {
      const approvedCaller = appRouter.createCaller(createContext("user", "approved"));
      await expect(approvedCaller.registry.uploadFile({ patientRecordId: 1, fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 4, category: "radiology_report", contentBase64: "YWJjZA==" })).resolves.toMatchObject({ fileName: "RAD-2026-001.pdf", category: "radiology_report" });
      expect(append).toHaveBeenCalledWith(1, 14, expect.objectContaining({ mimeType: "application/pdf", sizeBytes: 4 }));
    } finally { append.mockRestore(); }
  });

  it("rejects unsupported and oversized uploads at the router boundary", async () => {
    const caller = appRouter.createCaller(createContext("user", "approved"));
    await expect(caller.registry.uploadFile({ patientRecordId: 1, fileName: "RAD-2026-001.exe", mimeType: "application/x-msdownload" as any, sizeBytes: 4, category: "other", contentBase64: "YWJjZA==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.registry.uploadFile({ patientRecordId: 1, fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 15 * 1024 * 1024 + 1, category: "radiology_report", contentBase64: "YWJjZA==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("protects file listing and download procedures for approved users", async () => {
    const pendingCaller = appRouter.createCaller(createContext("user", "pending"));
    await expect(pendingCaller.registry.files({ patientRecordId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(pendingCaller.registry.downloadFile({ patientRecordId: 1, storageKey: "research-files/EGR-2026A/RAD-2026-001.pdf" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const list = vi.spyOn(db, "listResearchFiles").mockResolvedValue([]);
    const download = vi.spyOn(db, "getResearchFileUrl").mockResolvedValue({ fileName: "RAD-2026-001.pdf", url: "https://example.invalid/signed" });
    try {
      const approvedCaller = appRouter.createCaller(createContext("user", "approved"));
      await expect(approvedCaller.registry.files({ patientRecordId: 1 })).resolves.toEqual([]);
      await expect(approvedCaller.registry.downloadFile({ patientRecordId: 1, storageKey: "research-files/EGR-2026A/RAD-2026-001.pdf" })).resolves.toEqual({ fileName: "RAD-2026-001.pdf", url: "https://example.invalid/signed" });
      expect(download).toHaveBeenCalledWith(1, "research-files/EGR-2026A/RAD-2026-001.pdf");
    } finally { list.mockRestore(); download.mockRestore(); }
  });

  it("blocks pending users from every registry query before data access", async () => {
    const caller = appRouter.createCaller(createContext("user", "pending"));
    await expect(caller.registry.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks approved non-administrators from administrative procedures", async () => {
    const caller = appRouter.createCaller(createContext("user", "approved"));
    await expect(caller.administration.users()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an approved administrator to manually approve a pending user", async () => {
    const setAccess = vi.spyOn(db, "setUserAccessStatus").mockResolvedValue(undefined);
    const logAccess = vi.spyOn(db, "logAccessChange").mockResolvedValue(undefined);
    try {
      const caller = appRouter.createCaller(createContext("admin", "approved"));
      await expect(caller.administration.setAccess({ userId: 27, accessStatus: "approved" })).resolves.toEqual({ success: true });
      expect(setAccess).toHaveBeenCalledWith(27, "approved");
      expect(logAccess).toHaveBeenCalledWith(14, 27, "approved");
    } finally {
      setAccess.mockRestore();
      logAccess.mockRestore();
    }
  });
});
