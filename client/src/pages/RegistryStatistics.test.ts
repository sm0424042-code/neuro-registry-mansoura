import { describe, expect, it } from "vitest";
import { createAggregateStatisticsCsv, getStatisticShare, statisticLabel, type AggregateStatistics } from "./RegistryStatistics";

const aggregate: AggregateStatistics = { totalRecords: 10, byCohort: [{ cohort: "stroke", total: 6 }, { cohort: "cidp", total: 4 }], byEnrollment: [{ status: "enrolled", total: 8 }, { status: "screened", total: 2 }], byCompleteness: [{ status: "complete", total: 7 }, { status: "incomplete", total: 3 }], byDataQuality: [{ status: "complete", total: 7 }, { status: "draft", total: 3 }], investigationCoverage: { radiologyRecorded: 8, laboratoryRecorded: 9, neurologicalRecorded: 7, protocolChecklistComplete: 6 } };

describe("RegistryStatistics", () => {
  it("formats labels and aggregate shares without individual record data", () => {
    expect(statisticLabel("needs_review")).toBe("Needs review");
    expect(getStatisticShare(7, 10)).toBe(70);
    expect(getStatisticShare(0, 0)).toBe(0);
  });

  it("exports aggregate dimensions only", () => {
    const csv = createAggregateStatisticsCsv(aggregate);
    expect(csv).toContain('"Cohort","stroke","6","60%"');
    expect(csv).toContain('"Investigation coverage","Laboratory recorded","9","90%"');
    expect(csv).not.toMatch(/MUNR|research.?id|patient|diagnosis|clinical|narrative|email|assigned|recorded by/i);
  });
});
