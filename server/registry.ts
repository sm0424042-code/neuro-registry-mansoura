import { z } from "zod";
import type { CohortClinicalData, PatientRecord } from "../drizzle/schema";

const cohortSchema = z.enum(["stroke", "myasthenia_gravis", "guillain_barre", "myopathy"]);

const strokeClinicalSchema = z.object({
  cohort: z.literal("stroke"),
  strokeType: z.enum(["ischemic", "hemorrhagic", "tia", "other", "unknown"]),
  vascularTerritory: z.enum(["anterior", "posterior", "multiple", "unknown"]),
  nihssAtPresentation: z.number().int().min(0).max(42).nullable().optional(),
  mRsAtDischarge: z.number().int().min(0).max(6).nullable().optional(),
  reperfusionTherapy: z.enum(["none", "iv_thrombolysis", "mechanical_thrombectomy", "both", "unknown"]),
  toastEtiology: z.enum(["large_artery", "cardioembolic", "small_vessel", "other_determined", "undetermined", "unknown"]),
});

const myastheniaClinicalSchema = z.object({
  cohort: z.literal("myasthenia_gravis"),
  mgfaClass: z.enum(["I", "II", "III", "IV", "V", "unknown"]),
  antibodyStatus: z.enum(["achr", "musk", "lrp4", "seronegative", "unknown"]),
  thymomaStatus: z.enum(["present", "absent", "not_assessed", "unknown"]),
  myasthenicCrisis: z.enum(["never", "past", "current", "unknown"]),
  treatmentClass: z.enum(["symptomatic", "immunosuppression", "biologic", "thymectomy", "none", "unknown"]),
});

const gbsClinicalSchema = z.object({
  cohort: z.literal("guillain_barre"),
  gbsVariant: z.enum(["classical_aidp", "aman", "amsan", "miller_fisher", "other", "unknown"]),
  hughesDisabilityScore: z.number().int().min(0).max(6).nullable().optional(),
  ventilatorySupport: z.enum(["none", "non_invasive", "invasive", "unknown"]),
  antecedentInfection: z.enum(["yes", "no", "unknown"]),
  treatment: z.enum(["ivig", "plasmapheresis", "both", "supportive", "unknown"]),
});

const myopathyClinicalSchema = z.object({
  cohort: z.literal("myopathy"),
  myopathySubtype: z.enum(["inflammatory", "genetic", "metabolic", "muscular_dystrophy", "mitochondrial", "endocrine_toxic", "other", "unknown"]),
  geneticConfirmation: z.enum(["confirmed", "not_confirmed", "not_tested", "unknown"]),
  ckLevel: z.number().int().min(0).max(200000).nullable().optional(),
  muscleBiopsy: z.enum(["yes", "no", "not_done", "unknown"]),
  cardiacInvolvement: z.enum(["yes", "no", "unknown"]),
});

export const clinicalDataSchema = z.discriminatedUnion("cohort", [
  strokeClinicalSchema,
  myastheniaClinicalSchema,
  gbsClinicalSchema,
  myopathyClinicalSchema,
]);

export const patientInputSchema = z
  .object({
    researchId: z.string().trim().toUpperCase().regex(/^EGR-[A-Z0-9]{4,16}$/, "Use the format EGR-XXXX."),
    cohort: cohortSchema,
    sex: z.enum(["female", "male", "intersex", "not_recorded"]),
    ageAtEnrollment: z.number().int().min(0).max(120),
    ageAtOnset: z.number().int().min(0).max(120).nullable().optional(),
    consentStatus: z.enum(["consented", "pending", "declined", "withdrawn"]),
    enrollmentStatus: z.enum(["screened", "enrolled", "completed", "withdrawn", "ineligible"]),
    clinicalStatus: z.enum(["active", "follow_up", "completed", "deceased", "unknown"]),
    primaryDiagnosis: z.string().trim().min(2).max(160),
    dataQualityStatus: z.enum(["draft", "complete", "query"]),
    clinicalData: clinicalDataSchema,
  })
  .superRefine((value, context) => {
    if (value.cohort !== value.clinicalData.cohort) {
      context.addIssue({ code: "custom", path: ["clinicalData", "cohort"], message: "Clinical data must match the selected cohort." });
    }
    if (value.ageAtOnset !== null && value.ageAtOnset !== undefined && value.ageAtOnset > value.ageAtEnrollment) {
      context.addIssue({ code: "custom", path: ["ageAtOnset"], message: "Age at onset cannot exceed age at enrolment." });
    }
  });

export const patientUpdateSchema = patientInputSchema.safeExtend({ id: z.number().int().positive() });

export const registryFiltersSchema = z.object({
  cohort: cohortSchema.optional(),
  consentStatus: z.enum(["consented", "pending", "declined", "withdrawn"]).optional(),
  enrollmentStatus: z.enum(["screened", "enrolled", "completed", "withdrawn", "ineligible"]).optional(),
  clinicalStatus: z.enum(["active", "follow_up", "completed", "deceased", "unknown"]).optional(),
  dataQualityStatus: z.enum(["draft", "complete", "query"]).optional(),
  search: z.string().trim().max(24).optional(),
  ageMin: z.number().int().min(0).max(120).optional(),
  ageMax: z.number().int().min(0).max(120).optional(),
}).optional();

export function toAgeBand(age: number): string {
  if (age < 18) return "0-17";
  if (age < 30) return "18-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  if (age < 80) return "70-79";
  return "80+";
}

function cleanValue(value: string | number | boolean | null | undefined): string | number | boolean | null {
  return value ?? null;
}

export function toDeidentifiedExportRow(record: PatientRecord) {
  const clinicalData = record.clinicalData as CohortClinicalData;
  const base = {
    research_id: record.researchId,
    cohort: record.cohort,
    age_band_at_enrollment: toAgeBand(record.ageAtEnrollment),
    age_band_at_onset: record.ageAtOnset === null ? null : toAgeBand(record.ageAtOnset),
    consent_status: record.consentStatus,
    enrollment_status: record.enrollmentStatus,
    clinical_status: record.clinicalStatus,
    primary_diagnosis: record.primaryDiagnosis,
    data_quality_status: record.dataQualityStatus,
  };

  switch (clinicalData.cohort) {
    case "stroke":
      return { ...base, stroke_type: clinicalData.strokeType, vascular_territory: clinicalData.vascularTerritory, nihss_at_presentation: cleanValue(clinicalData.nihssAtPresentation), mrs_at_discharge: cleanValue(clinicalData.mRsAtDischarge), reperfusion_therapy: clinicalData.reperfusionTherapy, toast_etiology: clinicalData.toastEtiology };
    case "myasthenia_gravis":
      return { ...base, mgfa_class: clinicalData.mgfaClass, antibody_status: clinicalData.antibodyStatus, thymoma_status: clinicalData.thymomaStatus, myasthenic_crisis: clinicalData.myasthenicCrisis, treatment_class: clinicalData.treatmentClass };
    case "guillain_barre":
      return { ...base, gbs_variant: clinicalData.gbsVariant, hughes_disability_score: cleanValue(clinicalData.hughesDisabilityScore), ventilatory_support: clinicalData.ventilatorySupport, antecedent_infection: clinicalData.antecedentInfection, treatment: clinicalData.treatment };
    case "myopathy":
      return { ...base, myopathy_subtype: clinicalData.myopathySubtype, genetic_confirmation: clinicalData.geneticConfirmation, ck_level: cleanValue(clinicalData.ckLevel), muscle_biopsy: clinicalData.muscleBiopsy, cardiac_involvement: clinicalData.cardiacInvolvement };
  }
}
