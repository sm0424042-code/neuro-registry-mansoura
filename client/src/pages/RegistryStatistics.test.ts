import { describe, expect, it } from "vitest";
import { createAggregateStatisticsCsv, getStatisticShare, getStatisticsChartPngFileName, getStatisticsDateRangeLabel, statisticLabel, toAggregateChartData, type AggregateStatistics } from "./RegistryStatistics";

const aggregate: AggregateStatistics = { totalRecords: 10, byCohort: [{ cohort: "stroke", total: 6 }, { cohort: "cidp", total: 4 }], byEnrollment: [{ status: "enrolled", total: 8 }, { status: "screened", total: 2 }], byCompleteness: [{ status: "complete", total: 7 }, { status: "incomplete", total: 3 }], byDataQuality: [{ status: "complete", total: 7 }, { status: "draft", total: 3 }], investigationCoverage: { radiologyRecorded: 8, laboratoryRecorded: 9, neurologicalRecorded: 7, protocolChecklistComplete: 6 } };

describe("RegistryStatistics", () => {
  it("formats labels and aggregate shares without individual record data", () => {
    expect(statisticLabel("needs_review")).toBe("Needs review");
    expect(getStatisticShare(7, 10)).toBe(70);
    expect(getStatisticShare(0, 0)).toBe(0);
  });

  it("exports aggregate dimensions only", () => {
    const csv = createAggregateStatisticsCsv(aggregate, "2026-01-01 to 2026-01-31");
    expect(csv).toContain("# Registration date range (UTC): 2026-01-01 to 2026-01-31");
    expect(csv).toContain('"Cohort","stroke","6","60%"');
    expect(csv).toContain('"Investigation coverage","Laboratory recorded","9","90%"');
    expect(csv).not.toMatch(/MUNR|research.?id|patient|diagnosis|clinical|narrative|email|assigned|recorded by/i);
  });

  it("transforms aggregate-only dimensions into interactive chart data without individual fields", () => {
    const cohorts = toAggregateChartData(aggregate.byCohort, "cohort");
    const completion = toAggregateChartData(aggregate.byCompleteness, "completion");
    expect(cohorts).toEqual(expect.arrayContaining([expect.objectContaining({ key: "stroke", label: "stroke", total: 6, color: expect.any(String) })]));
    expect(completion).toEqual(expect.arrayContaining([expect.objectContaining({ key: "complete", label: "Complete", total: 7, color: expect.any(String) })]));
    expect(JSON.stringify([...cohorts, ...completion])).not.toMatch(/MUNR|research.?id|patient|diagnosis|clinical|email|recorded.?by/i);
  });

  it("uses a stable aggregate-only PNG filename for a chart export", () => {
    expect(getStatisticsChartPngFileName("Completion status", new Date("2026-08-27T12:00:00.000Z"))).toBe("registry-statistics-completion-status-2026-08-27.png");
    expect(getStatisticsChartPngFileName("Cohort distribution", new Date("2026-08-27T12:00:00.000Z"))).not.toMatch(/MUNR|research.?id|patient|clinical|email/i);
  });

  it("describes a selected registration-date window without individual record content", () => {
    expect(getStatisticsDateRangeLabel("2026-01-01", "2026-01-31")).toBe("2026-01-01 to 2026-01-31");
    expect(getStatisticsDateRangeLabel("2026-01-01")).toBe("From 2026-01-01");
    expect(getStatisticsDateRangeLabel()).toBe("All registration dates");
    expect(getStatisticsDateRangeLabel("2026-01-01", "2026-01-31")).not.toMatch(/MUNR|research.?id|patient|clinical|email/i);
  });
});
