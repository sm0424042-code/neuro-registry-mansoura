import { describe, expect, it } from "vitest";
import { createAggregateStatisticsCsv, getComparisonSignal, getPercentagePointDifferenceLabel, getStatisticDifferenceLabel, getStatisticShare, getStatisticsChartPngFileName, getStatisticsDateRangeLabel, statisticLabel, toAggregateChartData, toAggregateComparisonChartData, toComparisonReportRows, toCohortIndicatorDistributionComparison, type AggregateStatistics } from "./RegistryStatistics";

const aggregate: AggregateStatistics = { totalRecords: 10, byCohort: [{ cohort: "stroke", total: 6 }, { cohort: "cidp", total: 4 }], byEnrollment: [{ status: "enrolled", total: 8 }, { status: "screened", total: 2 }], byCompleteness: [{ status: "complete", total: 7 }, { status: "incomplete", total: 3 }], byDataQuality: [{ status: "complete", total: 7 }, { status: "draft", total: 3 }], investigationCoverage: { radiologyRecorded: 8, laboratoryRecorded: 9, neurologicalRecorded: 7, protocolChecklistComplete: 6 }, cohortIndicators: [{ id: "stroke_iv_thrombolysis", cohort: "stroke", title: "IV thrombolysis use", numeratorLabel: "IV thrombolysis or combined reperfusion", denominatorLabel: "All Stroke records", numerator: 3, denominator: 6, percentage: 50, distribution: [{ key: "iv_thrombolysis", label: "IV thrombolysis", total: 2, percentage: 33 }, { key: "none", label: "none", total: 3, percentage: 50 }, { key: "both", label: "Combined reperfusion", total: 1, percentage: 17 }] }] };

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

  it("compares aggregate category totals and includes only aggregate differences in comparison CSV", () => {
    const comparison = { ...aggregate, totalRecords: 7, byCohort: [{ cohort: "stroke", total: 3 }, { cohort: "multiple_sclerosis", total: 4 }], byEnrollment: [{ status: "enrolled", total: 7 }], byCompleteness: [{ status: "complete", total: 5 }, { status: "incomplete", total: 2 }], byDataQuality: [{ status: "complete", total: 5 }, { status: "draft", total: 2 }], investigationCoverage: { radiologyRecorded: 6, laboratoryRecorded: 6, neurologicalRecorded: 5, protocolChecklistComplete: 4 }, cohortIndicators: [{ ...aggregate.cohortIndicators[0], numerator: 1, denominator: 3, percentage: 33, distribution: [{ key: "iv_thrombolysis", label: "IV thrombolysis", total: 1, percentage: 33 }, { key: "none", label: "none", total: 2, percentage: 67 }] }] };
    expect(toAggregateComparisonChartData(aggregate.byCohort, comparison.byCohort)).toEqual(expect.arrayContaining([expect.objectContaining({ key: "stroke", current: 6, comparison: 3, difference: 3 }), expect.objectContaining({ key: "multiple_sclerosis", current: 0, comparison: 4, difference: -4 })]));
    expect(getStatisticDifferenceLabel(10, 7)).toBe("+3 vs comparison");
    const csv = createAggregateStatisticsCsv(aggregate, "2026-01-01 to 2026-01-31", comparison, "2025-01-01 to 2025-01-31");
    expect(csv).toContain("Dimension,Category,Current count,Comparison count,Difference");
    expect(csv).toContain('"Cohort","stroke","6","3","3"');
    expect(csv).toContain('"Cohort indicator","IV thrombolysis use — numerator","3","1","2"');
    expect(csv).not.toMatch(/MUNR|research.?id|patient|diagnosis|clinical|narrative|email|assigned|recorded by/i);
  });

  it("compares a cohort-specific rate and its controlled distribution without individual content", () => {
    const current = aggregate.cohortIndicators[0];
    const comparison = { ...current, numerator: 1, denominator: 3, percentage: 33, distribution: [{ key: "iv_thrombolysis", label: "IV thrombolysis", total: 1, percentage: 33 }, { key: "none", label: "none", total: 2, percentage: 67 }] };
    expect(toCohortIndicatorDistributionComparison(current, comparison)).toEqual(expect.arrayContaining([expect.objectContaining({ key: "iv_thrombolysis", current: 2, comparison: 1, currentPercentage: 33, comparisonPercentage: 33, difference: 0 })]));
    expect(getPercentagePointDifferenceLabel(50, 33)).toBe("+17 percentage points");
    expect(JSON.stringify(toCohortIndicatorDistributionComparison(current, comparison))).not.toMatch(/MUNR|research.?id|patient|diagnosis|clinical|email|recorded.?by/i);
  });

  it("labels comparison direction without relying on colour and builds aggregate-only report rows", () => {
    const current = aggregate.cohortIndicators[0];
    const comparison = { ...current, numerator: 1, denominator: 3, percentage: 33 };
    expect(getComparisonSignal(5, 2)).toMatchObject({ label: "Increase", difference: 3 });
    expect(getComparisonSignal(2, 5)).toMatchObject({ label: "Decrease", difference: -3 });
    expect(getComparisonSignal(5, 5)).toMatchObject({ label: "No change", difference: 0 });
    expect(toComparisonReportRows([current], [comparison])).toEqual([expect.objectContaining({ cohort: "Stroke", indicator: "IV thrombolysis use", currentPercentage: 50, comparisonPercentage: 33, percentagePointDifference: 17 })]);
    expect(JSON.stringify(toComparisonReportRows([current], [comparison]))).not.toMatch(/MUNR|research.?id|patient|diagnosis|clinical|narrative|email|recorded.?by/i);
  });
});
