import { describe, expect, it } from "vitest";
import type { PatientRecord } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { patientInputSchema, registryFiltersSchema, toAgeBand, toDeidentifiedExportRow } from "./registry";
import { appRouter } from "./routers";

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
      createdByUserId: 1, lastModifiedByUserId: 2, createdAt: new Date(), updatedAt: new Date(),
    } as PatientRecord);
    expect(row).toMatchObject({ research_id: "EGR-2026A", age_band_at_enrollment: "60-69", stroke_type: "ischemic" });
    expect(row).not.toHaveProperty("id");
    expect(row).not.toHaveProperty("sex");
    expect(row).not.toHaveProperty("createdByUserId");
    expect(row).not.toHaveProperty("createdAt");
  });

  it("blocks pending users from every registry query before data access", async () => {
    const caller = appRouter.createCaller(createContext("user", "pending"));
    await expect(caller.registry.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks approved non-administrators from administrative procedures", async () => {
    const caller = appRouter.createCaller(createContext("user", "approved"));
    await expect(caller.administration.users()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
