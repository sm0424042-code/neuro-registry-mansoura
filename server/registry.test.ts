import { describe, expect, it, vi } from "vitest";
import type { PatientRecord } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { patientInputSchema, radiologicalInvestigationSchema, registryFiltersSchema, toAgeBand, toDeidentifiedExportRow } from "./registry";
import { appRouter } from "./routers";
import * as db from "./db";

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
      clinicalData: { cohort: "myopathy", myopathySubtype: "genetic", geneticConfirmation: "confirmed", muscleBiopsy: "yes", cardiacInvolvement: "no" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid patient payload for each requested neurological cohort", () => {
    const base = { sex: "not_recorded", ageAtEnrollment: 50, ageAtOnset: 48, consentStatus: "consented", enrollmentStatus: "enrolled", clinicalStatus: "active", primaryDiagnosis: "Research diagnosis", dataQualityStatus: "draft", radiologicalInvestigations: [] } as const;
    const cases = [
      ["stroke", { cohort: "stroke", strokeType: "ischemic", vascularTerritory: "anterior", reperfusionTherapy: "none", toastEtiology: "unknown" }],
      ["neurovascular_compression_syndrome", { cohort: "neurovascular_compression_syndrome", compressionSite: "trigeminal_nerve", symptomPattern: "paroxysmal", imagingConfirmed: "unknown", surgicalIntervention: "none" }],
      ["vessel_disease", { cohort: "vessel_disease", diseaseType: "atherosclerotic", vascularBed: "intracranial", diagnosticMethod: "mri", intervention: "medical" }],
      ["epilepsy", { cohort: "epilepsy", epilepsyType: "focal", seizureFrequency: "monthly_or_less", seizureControl: "controlled", eegAbnormality: "unknown", treatmentResponse: "responsive" }],
      ["neurodegenerative", { cohort: "neurodegenerative", diseaseSubtype: "parkinson_disease", diseaseStage: "early", cognitiveInvolvement: "unknown", geneticTesting: "not_done", progressionPattern: "slow" }],
      ["abnormal_movement", { cohort: "abnormal_movement", movementPhenotype: "tremor", distribution: "focal", severity: "mild", functionalImpact: "mild", treatmentResponse: "responsive" }],
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
      radiologicalInvestigations: [{ modality: "mri", bodyRegion: "brain", keyFinding: "No acute lesion", lesionStatus: "absent", reportReference: "RAD-2026-001" }], createdByUserId: 1, lastModifiedByUserId: 2, createdAt: new Date(), updatedAt: new Date(),
    } as PatientRecord);
    expect(row).toMatchObject({ research_id: "EGR-2026A", age_band_at_enrollment: "60-69", stroke_type: "ischemic" });
    expect(row).not.toHaveProperty("id");
    expect(row).not.toHaveProperty("sex");
    expect(row).not.toHaveProperty("createdByUserId");
    expect(row).not.toHaveProperty("createdAt");
    expect(row.radiological_investigations).toEqual([{ modality: "mri", body_region: "brain", key_finding: "No acute lesion", lesion_status: "absent" }]);
  });

  it("validates radiological investigations without allowing identifying report references", () => {
    expect(radiologicalInvestigationSchema.safeParse({ modality: "mri", bodyRegion: "brain", keyFinding: "Focal lesion", lesionStatus: "present", reportReference: "RAD-2026-001" }).success).toBe(true);
    expect(radiologicalInvestigationSchema.safeParse({ modality: "mri", bodyRegion: "brain", keyFinding: "Focal lesion", lesionStatus: "present", reportReference: "MRN-12345" }).success).toBe(false);
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
