import { describe, expect, it } from "vitest";
import { clinicalSelectorOptions, cohortImmuneTherapyOptions, getClinicalSelectorOptions, getCohortInvestigationOptions, getRecordSaveValidationError, getRecordedByLabel, getSavedRecordDestination } from "./PatientEditor";

describe("PatientEditor cohort-specific options", () => {
  it("keeps stroke laboratory choices distinct from MS treatment-screening choices", () => {
    const codes = (options: Array<[string, string]>) => options.map(([code]) => code);
    const strokeTests = codes(getCohortInvestigationOptions("stroke", "laboratory") as Array<[string, string]>);
    const msTests = codes(getCohortInvestigationOptions("multiple_sclerosis", "laboratory") as Array<[string, string]>);
    expect(strokeTests).toEqual(expect.arrayContaining(["hba1c", "uric_acid", "lipid_profile"]));
    expect(strokeTests).not.toContain("varicella_immunity");
    expect(msTests).toContain("varicella_immunity");
    expect(msTests).not.toContain("lipid_profile");
  });

  it("limits neurological investigations and imaging regions to the selected cohort pathway", () => {
    const codes = (options: Array<[string, string]>) => options.map(([code]) => code);
    const neuroOphthalmology = codes(getCohortInvestigationOptions("neuro_ophthalmology", "neurological") as Array<[string, string]>);
    const gbs = codes(getCohortInvestigationOptions("guillain_barre", "neurological") as Array<[string, string]>);
    const strokeImaging = getCohortInvestigationOptions("stroke", "radiology") as { modalities: Array<[string, string]>; regions: Array<[string, string]> };
    expect(neuroOphthalmology).toEqual(expect.arrayContaining(["fundus_examination", "aqp4_mog_antibodies", "temporal_artery_assessment"]));
    expect(gbs).toContain("emg_ncs");
    expect(gbs).not.toContain("fundus_examination");
    expect(strokeImaging.regions.map(([code]) => code)).toEqual(["brain", "cerebral_vessels"]);
  });

  it("offers immune therapies only from the active cohort therapy pathway", () => {
    const gbsTherapies = cohortImmuneTherapyOptions.guillain_barre.map(([code]) => code);
    const msTherapies = cohortImmuneTherapyOptions.multiple_sclerosis.map(([code]) => code);
    expect(gbsTherapies).toEqual(expect.arrayContaining(["ivig", "plasma_exchange"]));
    expect(gbsTherapies).not.toContain("b_cell_depleting");
    expect(msTherapies).toContain("b_cell_depleting");
  });

  it("limits clinical selectors to the relevant choices and preserves historic values only during review", () => {
    const codes = (options: Array<[string, string]>) => options.map(([code]) => code);
    expect(codes(getClinicalSelectorOptions("Stroke type", [["ischemic", "Ischaemic"], ["hemorrhagic", "Haemorrhagic"], ["tia", "TIA"], ["aidp", "AIDP"]], "unknown"))).toEqual(["ischemic", "hemorrhagic", "tia", "unknown"]);
    expect(codes(getClinicalSelectorOptions("GBS variant", [["aidp", "AIDP"], ["aman", "AMAN"]], "madsam"))).toEqual(["madsam", "aidp", "aman", "amsan", "miller_fisher", "other", "unknown"]);
    expect(codes(getClinicalSelectorOptions("CIDP variant", [["typical", "Typical CIDP"], ["madsam", "MADSAM"]], "typical"))).not.toContain("aidp");
  });

  it("gives every cohort-specific clinical field a dedicated option set instead of the former generic catalogue", () => {
    const fields = [
      "Stroke type", "Vascular territory", "Reperfusion therapy", "TOAST aetiology", "Stroke complication", "Stroke evaluation",
      "Disease course", "Disability level", "Relapse activity", "Disease-modifying therapy", "MSFC assessed", "Tuberculin / IGRA screen", "Chest tuberculosis screen", "MS evaluation",
      "Movement phenotype", "Distribution", "Severity", "Functional impact", "Treatment response", "Movement evaluation",
      "GBS variant", "Disability score", "Ventilatory support", "Treatment", "GBS evaluation",
      "MGFA class", "Antibody status", "Thymoma status", "Crisis history", "MG evaluation",
      "Spinal level", "Likely cause", "UMN signs", "LMN features", "Bladder involvement", "Myelopathy evaluation",
      "Visual syndrome", "Laterality", "Acuity change", "Afferent defect", "Disease classification", "AQP4 / MOG profile", "Linked systemic disease", "Neuro-ophthalmology evaluation",
      "CIDP variant", "Diagnostic pathway", "EMG/NCS evidence", "CSF protein status", "CIDP / neuropathy evaluation",
    ];
    expect(fields).toHaveLength(49);
    expect(Object.keys(clinicalSelectorOptions)).toEqual(expect.arrayContaining(fields));
    expect(Object.keys(clinicalSelectorOptions)).toHaveLength(49);
  });

  it("explains why a record was not submitted before a create request is attempted", () => {
    expect(getRecordSaveValidationError({ researchId: "", primaryDiagnosis: "Stroke", ageAtEnrollment: "50" })).toContain("Research ID");
    expect(getRecordSaveValidationError({ researchId: "MUNR-0000000000000000000000001", primaryDiagnosis: "", ageAtEnrollment: "50" })).toContain("diagnosis");
    expect(getRecordSaveValidationError({ researchId: "MUNR-0000000000000000000000001", primaryDiagnosis: "Stroke", ageAtEnrollment: "" })).toContain("age");
    expect(getRecordSaveValidationError({ researchId: "MUNR-0000000000000000000000001", primaryDiagnosis: "Stroke", ageAtEnrollment: "50" })).toBeNull();
    expect(getRecordSaveValidationError({ researchId: "MUNR-000000000000000000000000", primaryDiagnosis: "Stroke", ageAtEnrollment: "50" })).toContain("25 digits");
    expect(getRecordSaveValidationError({ researchId: "MUNR-0000000000000000000000001A", primaryDiagnosis: "Stroke", ageAtEnrollment: "50" })).toContain("25 digits");
    expect(getRecordSaveValidationError({ researchId: "MUNR-00000000000001", primaryDiagnosis: "Stroke", ageAtEnrollment: "50", mode: "edit" })).toBeNull();
  });

  it("routes a successfully saved research record to its pseudonymised registry search", () => {
    expect(getSavedRecordDestination("munr-0000000000000000000000001")).toBe("/registry?search=MUNR-0000000000000000000000001");
  });

  it("shows only the OAuth display name for protected record attribution and uses a non-identifying fallback", () => {
    expect(getRecordedByLabel("Approved Researcher")).toBe("Approved Researcher");
    expect(getRecordedByLabel(null)).toBe("OAuth display name unavailable");
  });
});
