import { describe, expect, it } from "vitest";
import { cohortImmuneTherapyOptions, getCohortInvestigationOptions } from "./PatientEditor";

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
});
