import { describe, expect, it, vi } from "vitest";
import type { PatientRecord } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getInvestigationCoverage, getPatientUpdateAuditSummary, patientInputSchema, researchFileInputSchema, toDeidentifiedExportRow } from "./registry";
import { appRouter } from "./routers";
import * as db from "./db";
import { updatePatientRecordWithDb } from "./db";

function context(role: "admin" | "user", accessStatus: "pending" | "approved" | "suspended"): TrpcContext { return { user: { id: 14, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role, accessStatus, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const base = { sex: "not_recorded", ageAtEnrollment: 50, ageAtOnset: 48, consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "active", primaryDiagnosis: "Research diagnosis", dataQualityStatus: "draft", completenessStatus: "incomplete", missingItems: ["follow_up"], completionOwnerUserId: null, radiologicalInvestigations: [], laboratoryInvestigations: [], neurologicalInvestigations: [], protocolInvestigations: [], followUpVisits: [] } as const;

describe("Mansoura University registry validation", () => {
  it("requires a pseudonymised MUNR Research ID and rejects direct identifiers", () => {
    expect(patientInputSchema.shape.researchId.safeParse("MUNR-2026A").success).toBe(true);
    expect(patientInputSchema.shape.researchId.safeParse("EGR-2026A").success).toBe(false);
    expect(patientInputSchema.shape.researchId.safeParse("AHMED-MRN-12345").success).toBe(false);
  });

  it("accepts all approved neurology cohorts including CIDP", () => {
    const cases = [
      ["stroke", { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "mca_complete", reperfusionTherapy: "none", toastEtiology: "unknown" }],
      ["ms", { cohort: "multiple_sclerosis", diseaseCourse: "relapsing_remitting", disabilityLevel: "mild", relapseActivity: "inactive", diseaseModifyingTherapy: "ocrelizumab", msfcAssessed: "yes", timed25FootWalkSeconds: 10, nineHolePegTestSeconds: 24, pasat3Score: 42 }],
      ["movement", { cohort: "abnormal_movements", movementPhenotype: "tremor", distribution: "focal", severity: "mild", functionalImpact: "mild", treatmentResponse: "responsive" }],
      ["gbs", { cohort: "guillain_barre", variant: "aidp", disabilityScore: "2", ventilatorySupport: "none", treatment: "ivig" }],
      ["mg", { cohort: "myasthenia_gravis", mgfaClass: "II", antibodyStatus: "achr", thymomaStatus: "absent", crisisHistory: "never", treatmentResponse: "responsive" }],
      ["myelopathy", { cohort: "myelopathy", level: "cervical", cause: "compressive", upperMotorNeuronSigns: "present", lowerMotorNeuronFeatures: "absent", bladderInvolvement: "no" }],
      ["neurooph", { cohort: "neuro_ophthalmology", visualSyndrome: "optic_neuritis", laterality: "right", acuityChange: "stable", afferentDefect: "yes", specialistAssessment: "probable" }],
      ["cidp", { cohort: "cidp", phenotype: "typical", disabilityLevel: "moderate", emgNcsEvidence: "demyelinating", csfProteinStatus: "elevated" }],
    ] as const;
    for (const [suffix, clinicalData] of cases) expect(patientInputSchema.safeParse({ ...base, researchId: `MUNR-${suffix.toUpperCase()}26`, cohort: clinicalData.cohort, clinicalData }).success, suffix).toBe(true);
  });

  it("validates MSFC components, MS DMT examples, Stroke laboratory fields, and vascular territories", () => {
    const ms = patientInputSchema.safeParse({ ...base, researchId: "MUNR-MSFC26", cohort: "multiple_sclerosis", clinicalData: { cohort: "multiple_sclerosis", diseaseCourse: "relapsing_remitting", disabilityLevel: "mild", relapseActivity: "active", diseaseModifyingTherapy: "natalizumab", msfcAssessed: "yes", timed25FootWalkSeconds: 12, nineHolePegTestSeconds: 26, pasat3Score: 45 }, laboratoryInvestigations: [{ testName: "thyroid_function", resultStatus: "normal" }, { testName: "hba1c", resultStatus: "abnormal" }, { testName: "lipid_profile", resultStatus: "abnormal" }, { testName: "uric_acid", resultStatus: "normal" }] });
    expect(ms.success).toBe(true);
    const stroke = patientInputSchema.safeParse({ ...base, researchId: "MUNR-STROKE26", cohort: "stroke", clinicalData: { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "vertebrobasilar", reperfusionTherapy: "none", toastEtiology: "unknown" } });
    expect(stroke.success).toBe(true);
  });

  it("enforces completion workflow consistency", () => {
    const record = patientInputSchema.safeParse({ ...base, researchId: "MUNR-COMP26", cohort: "cidp", completenessStatus: "complete", missingItems: ["laboratory"], clinicalData: { cohort: "cidp", phenotype: "typical", disabilityLevel: "mild", emgNcsEvidence: "demyelinating", csfProteinStatus: "elevated" } });
    expect(record.success).toBe(false);
  });

  it("summarises radiology, laboratory, neurological, and protocol investigation coverage for the overview", () => {
    const coverage = getInvestigationCoverage([
      { radiologicalInvestigations: [{}], laboratoryInvestigations: [{}], neurologicalInvestigations: [{}], protocolInvestigations: [{ status: "completed" }, { status: "not_indicated" }] },
      { radiologicalInvestigations: [], laboratoryInvestigations: [{}], neurologicalInvestigations: [], protocolInvestigations: [{ status: "ordered" }] },
    ]);
    expect(coverage).toEqual({ totalRecords: 2, radiologyRecorded: 1, laboratoryRecorded: 2, neurologicalRecorded: 1, protocolChecklistComplete: 1, protocolChecklistOutstanding: 1 });
  });

  it("exports research-safe summaries while excluding completion ownership and research files", () => {
    const row = toDeidentifiedExportRow({ id: 7, researchId: "MUNR-STROKE26", cohort: "stroke", sex: "male", ageAtEnrollment: 64, ageAtOnset: 63, consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "active", dataQualityStatus: "complete", completenessStatus: "incomplete", missingItems: ["follow_up"], completionOwnerUserId: 33, primaryDiagnosis: "Ischaemic stroke", clinicalData: { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "aca", reperfusionTherapy: "iv_thrombolysis", toastEtiology: "cardioembolic" }, radiologicalInvestigations: [{ modality: "mri", bodyRegion: "brain", keyFinding: "Focal lesion", lesionStatus: "present", reportReference: "RAD-2026-001" }], laboratoryInvestigations: [{ testName: "hba1c", resultStatus: "abnormal", resultSummary: "Above local reference range" }], neurologicalInvestigations: [{ testName: "fundus_examination", resultStatus: "normal" }], protocolInvestigations: [{ itemCode: "vascular_imaging", status: "completed" }], followUpVisits: [{ visitType: "routine", followUpStatus: "completed", outcome: "stable", assessmentSummary: "Stable", timepoint: "3_months" }], researchFiles: [{ fileName: "RAD-2026-001.pdf", storageKey: "key", url: "url", mimeType: "application/pdf", sizeBytes: 4, category: "radiology_report", uploadedAt: "2026-01-01", uploadedByUserId: 14 }], createdByUserId: 1, lastModifiedByUserId: 2, createdAt: new Date(), updatedAt: new Date() } as PatientRecord);
    expect(row).toMatchObject({ research_id: "MUNR-STROKE26", age_band_at_enrollment: "60-69", vascular_territory: "aca", completeness_status: "incomplete" });
    expect(row).not.toHaveProperty("completionOwnerUserId"); expect(row).not.toHaveProperty("research_files"); expect(row.radiological_investigations).toEqual([{ modality: "mri", body_region: "brain", key_finding: "Focal lesion", lesion_status: "present" }]);
  });

  it("protects upload metadata and enforces allowed file types and size", () => {
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "RAD-2026-001.pdf", mimeType: "application/pdf", sizeBytes: 1024, category: "radiology_report", contentBase64: "YWJjZA==" }).success).toBe(true);
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "patient-name.pdf", mimeType: "application/pdf", sizeBytes: 1024, category: "radiology_report", contentBase64: "YWJjZA==" }).success).toBe(false);
    expect(researchFileInputSchema.safeParse({ patientRecordId: 1, fileName: "RAD-2026-001.exe", mimeType: "application/x-msdownload", sizeBytes: 4, category: "other", contentBase64: "YWJjZA==" }).success).toBe(false);
  });

  it("writes an audit event that identifies follow-up and completion changes", async () => {
    const auditRows: unknown[] = []; let selected = 0; const fakeDb: any = { select: () => ({ from: () => ({ where: () => ({ limit: async () => { selected += 1; return selected === 1 ? [{ id: 7 }] : [{ id: 7, researchId: "MUNR-FOLLOW26" }]; } }) }) }), update: () => ({ set: () => ({ where: async () => undefined }) }), insert: () => ({ values: async (row: unknown) => auditRows.push(row) }) };
    const input: any = { ...base, researchId: "MUNR-FOLLOW26", cohort: "cidp", clinicalData: { cohort: "cidp", phenotype: "typical", disabilityLevel: "mild", emgNcsEvidence: "demyelinating", csfProteinStatus: "elevated" }, followUpVisits: [{ visitType: "routine", followUpStatus: "completed", outcome: "stable", assessmentSummary: "Stable", timepoint: "3_months" }] };
    await updatePatientRecordWithDb(fakeDb, 7, input, 14); expect(auditRows).toHaveLength(1); expect(auditRows[0]).toMatchObject({ patientRecordId: 7, actorUserId: 14, action: "updated" }); expect(getPatientUpdateAuditSummary(input)).toContain("patient follow-up");
  });

  it("blocks pending users and permits an approved administrator to approve a new user", async () => {
    await expect(appRouter.createCaller(context("user", "pending")).registry.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const setAccess = vi.spyOn(db, "setUserAccessStatus").mockResolvedValue(undefined); const logAccess = vi.spyOn(db, "logAccessChange").mockResolvedValue(undefined);
    try { await expect(appRouter.createCaller(context("admin", "approved")).administration.setAccess({ userId: 27, accessStatus: "approved" })).resolves.toEqual({ success: true }); expect(setAccess).toHaveBeenCalledWith(27, "approved"); } finally { setAccess.mockRestore(); logAccess.mockRestore(); }
  });
});
