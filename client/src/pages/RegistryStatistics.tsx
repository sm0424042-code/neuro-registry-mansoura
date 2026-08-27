import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { toPng } from "html-to-image";
import { ArrowDown, ArrowUp, BarChart3, CalendarRange, Download, FilterX, ImageDown, Info, LoaderCircle, Microscope, Minus, ShieldCheck } from "lucide-react";
import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, XAxis, YAxis } from "recharts";

const cohorts = [
  { value: "all", label: "All cohorts" },
  { value: "stroke", label: "Stroke" },
  { value: "multiple_sclerosis", label: "Multiple Sclerosis" },
  { value: "abnormal_movements", label: "Abnormal Movements" },
  { value: "guillain_barre", label: "Guillain–Barré" },
  { value: "myasthenia_gravis", label: "Myasthenia Gravis" },
  { value: "myelopathy", label: "Myelopathy" },
  { value: "neuro_ophthalmology", label: "Neuro-ophthalmology" },
  { value: "cidp", label: "CIDP" },
] as const;

type StatisticsCohort = typeof cohorts[number]["value"];
type CompletionStatus = "all" | "complete" | "incomplete" | "needs_review";
type EnrollmentStatus = "all" | "screened" | "enrolled" | "completed" | "withdrawn" | "ineligible";
type AggregateDimensionRow = { cohort?: string; status?: string; total: number };
export type AggregateChartDatum = { key: string; label: string; total: number; color: string };
export type AggregateComparisonChartDatum = { key: string; label: string; current: number; comparison: number; difference: number };
export type CohortIndicatorDistribution = { key: string; label: string; total: number; percentage: number };
export type CohortClinicalIndicator = { id: string; cohort: string; title: string; numeratorLabel: string; denominatorLabel: string; numerator: number; denominator: number; percentage: number; distribution: CohortIndicatorDistribution[] };
export type CohortIndicatorDistributionComparison = { key: string; label: string; current: number; comparison: number; currentPercentage: number; comparisonPercentage: number; difference: number };
export type ComparisonReportRow = { cohort: string; indicator: string; currentNumerator: number; currentDenominator: number; currentPercentage: number; comparisonNumerator: number; comparisonDenominator: number; comparisonPercentage: number; percentagePointDifference: number };

const statusLabels: Record<string, string> = {
  complete: "Complete", incomplete: "Incomplete", needs_review: "Needs review", screened: "Screened", enrolled: "Enrolled", completed: "Completed", withdrawn: "Withdrawn", ineligible: "Ineligible", draft: "Draft", query: "Query",
};
const cohortColors = ["#197b8a", "#685f98", "#b96d45", "#69855b", "#805e85", "#48809a", "#9b7048", "#4a8d74"];
const completionColors: Record<string, string> = { complete: "#418c63", incomplete: "#ca8a3d", needs_review: "#477ca6" };
const chartConfig = { total: { label: "Records", color: "#287a73" }, current: { label: "Current period", color: "#287a73" }, comparison: { label: "Comparison period", color: "#8b7bb8" } } satisfies ChartConfig;

export type AggregateStatisticsCore = {
  totalRecords: number;
  byCohort: Array<{ cohort: string; total: number }>;
  byEnrollment: Array<{ status: string; total: number }>;
  byCompleteness: Array<{ status: string; total: number }>;
  byDataQuality: Array<{ status: string; total: number }>;
  investigationCoverage: { radiologyRecorded: number; laboratoryRecorded: number; neurologicalRecorded: number; protocolChecklistComplete: number };
  cohortIndicators: CohortClinicalIndicator[];
};
export type AggregateStatistics = AggregateStatisticsCore & { comparison?: AggregateStatisticsCore };

export function getStatisticShare(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0; }
export function statisticLabel(value: string) { return statusLabels[value] ?? value.replaceAll("_", " "); }
export function getStatisticsDateRangeLabel(startDate?: string, endDate?: string) {
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `Up to ${endDate}`;
  return "All registration dates";
}
export function getStatisticDifferenceLabel(current: number, comparison: number) {
  const difference = current - comparison;
  return difference === 0 ? "No change" : `${difference > 0 ? "+" : ""}${difference} vs comparison`;
}
export function getPercentagePointDifferenceLabel(current: number, comparison: number) {
  const difference = current - comparison;
  return difference === 0 ? "No percentage-point change" : `${difference > 0 ? "+" : ""}${difference} percentage points`;
}
export function getComparisonSignal(current: number, comparison: number) {
  const difference = current - comparison;
  if (difference > 0) return { label: "Increase", difference, className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  if (difference < 0) return { label: "Decrease", difference, className: "border-rose-200 bg-rose-50 text-rose-800" };
  return { label: "No change", difference, className: "border-slate-200 bg-slate-50 text-slate-700" };
}
function getAggregateDimensionKey(row: AggregateDimensionRow) { return row.cohort ?? row.status ?? "not_recorded"; }
export function toAggregateChartData(rows: AggregateDimensionRow[] | undefined, palette: "cohort" | "completion" | "default" = "default"): AggregateChartDatum[] {
  return (rows ?? []).map((row, index) => {
    const key = getAggregateDimensionKey(row);
    const color = palette === "cohort" ? cohortColors[index % cohortColors.length] : palette === "completion" ? completionColors[key] ?? "#718096" : "#287a73";
    return { key, label: statisticLabel(key), total: row.total, color };
  });
}
export function toAggregateComparisonChartData(currentRows: AggregateDimensionRow[] | undefined, comparisonRows: AggregateDimensionRow[] | undefined): AggregateComparisonChartDatum[] {
  const current = new Map((currentRows ?? []).map(row => [getAggregateDimensionKey(row), row.total]));
  const comparison = new Map((comparisonRows ?? []).map(row => [getAggregateDimensionKey(row), row.total]));
  const keys = [...Array.from(current.keys()), ...Array.from(comparison.keys()).filter(key => !current.has(key))];
  return keys.map(key => { const currentTotal = current.get(key) ?? 0; const comparisonTotal = comparison.get(key) ?? 0; return { key, label: statisticLabel(key), current: currentTotal, comparison: comparisonTotal, difference: currentTotal - comparisonTotal }; });
}
export function toCohortIndicatorDistributionComparison(current?: CohortClinicalIndicator, comparison?: CohortClinicalIndicator): CohortIndicatorDistributionComparison[] {
  const currentByKey = new Map((current?.distribution ?? []).map(row => [row.key, row]));
  const comparisonByKey = new Map((comparison?.distribution ?? []).map(row => [row.key, row]));
  const keys = [...Array.from(currentByKey.keys()), ...Array.from(comparisonByKey.keys()).filter(key => !currentByKey.has(key))];
  return keys.map(key => {
    const currentRow = currentByKey.get(key);
    const comparisonRow = comparisonByKey.get(key);
    const currentPercentage = currentRow?.percentage ?? 0;
    const comparisonPercentage = comparisonRow?.percentage ?? 0;
    return { key, label: currentRow?.label ?? comparisonRow?.label ?? statisticLabel(key), current: currentRow?.total ?? 0, comparison: comparisonRow?.total ?? 0, currentPercentage, comparisonPercentage, difference: currentPercentage - comparisonPercentage };
  });
}
export function toComparisonReportRows(currentIndicators: CohortClinicalIndicator[], comparisonIndicators: CohortClinicalIndicator[]): ComparisonReportRow[] {
  const comparisonById = new Map(comparisonIndicators.map(indicator => [indicator.id, indicator]));
  return currentIndicators.map(indicator => {
    const comparison = comparisonById.get(indicator.id);
    const comparisonPercentage = comparison?.percentage ?? 0;
    return { cohort: cohorts.find(item => item.value === indicator.cohort)?.label ?? statisticLabel(indicator.cohort), indicator: indicator.title, currentNumerator: indicator.numerator, currentDenominator: indicator.denominator, currentPercentage: indicator.percentage, comparisonNumerator: comparison?.numerator ?? 0, comparisonDenominator: comparison?.denominator ?? 0, comparisonPercentage, percentagePointDifference: indicator.percentage - comparisonPercentage };
  }).filter(row => row.currentDenominator > 0 || row.comparisonDenominator > 0);
}
function appendAggregateComparisonRows(dimension: string, currentRows: AggregateDimensionRow[], comparisonRows: AggregateDimensionRow[]): Array<[string, string, number, number, number]> {
  return toAggregateComparisonChartData(currentRows, comparisonRows).map(row => [dimension, row.label, row.current, row.comparison, row.difference]);
}
function appendIndicatorRows(rows: Array<[string, string, number, string]>, indicators: CohortClinicalIndicator[]) {
  indicators.filter(indicator => indicator.denominator > 0).forEach(indicator => {
    rows.push(["Cohort indicator", `${indicator.title} — numerator`, indicator.numerator, `${indicator.percentage}%`]);
    rows.push(["Cohort indicator", `${indicator.title} — denominator`, indicator.denominator, "100%"]);
  });
}
function appendIndicatorComparisonRows(rows: Array<[string, string, number, number, number]>, indicators: CohortClinicalIndicator[], comparisonIndicators: CohortClinicalIndicator[]) {
  const comparisonById = new Map(comparisonIndicators.map(indicator => [indicator.id, indicator]));
  indicators.forEach(indicator => {
    const comparison = comparisonById.get(indicator.id);
    if (!indicator.denominator && !comparison?.denominator) return;
    rows.push(["Cohort indicator", `${indicator.title} — numerator`, indicator.numerator, comparison?.numerator ?? 0, indicator.numerator - (comparison?.numerator ?? 0)]);
    rows.push(["Cohort indicator", `${indicator.title} — denominator`, indicator.denominator, comparison?.denominator ?? 0, indicator.denominator - (comparison?.denominator ?? 0)]);
  });
}
export function createAggregateStatisticsCsv(data: AggregateStatisticsCore, currentDateRangeLabel = "All registration dates", comparison?: AggregateStatisticsCore, comparisonDateRangeLabel?: string) {
  if (comparison) {
    const rows: Array<[string, string, number, number, number]> = [["Records", "All matching records", data.totalRecords, comparison.totalRecords, data.totalRecords - comparison.totalRecords]];
    rows.push(...appendAggregateComparisonRows("Cohort", data.byCohort, comparison.byCohort));
    rows.push(...appendAggregateComparisonRows("Completion status", data.byCompleteness, comparison.byCompleteness));
    rows.push(...appendAggregateComparisonRows("Enrollment status", data.byEnrollment, comparison.byEnrollment));
    rows.push(...appendAggregateComparisonRows("Data quality", data.byDataQuality, comparison.byDataQuality));
    const coverage: Array<[string, number, number]> = [["Radiology recorded", data.investigationCoverage.radiologyRecorded, comparison.investigationCoverage.radiologyRecorded], ["Laboratory recorded", data.investigationCoverage.laboratoryRecorded, comparison.investigationCoverage.laboratoryRecorded], ["Neurological recorded", data.investigationCoverage.neurologicalRecorded, comparison.investigationCoverage.neurologicalRecorded], ["Protocol checklist complete", data.investigationCoverage.protocolChecklistComplete, comparison.investigationCoverage.protocolChecklistComplete]];
    coverage.forEach(([label, current, prior]) => rows.push(["Investigation coverage", label, current, prior, current - prior]));
    appendIndicatorComparisonRows(rows, data.cohortIndicators, comparison.cohortIndicators);
    return [`# Current registration date range (UTC): ${currentDateRangeLabel}`, `# Comparison registration date range (UTC): ${comparisonDateRangeLabel ?? "Not selected"}`, "Dimension,Category,Current count,Comparison count,Difference", ...rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
  }
  const rows: Array<[string, string, number, string]> = [["Records", "All matching records", data.totalRecords, "100%"]];
  const append = (dimension: string, entries: AggregateDimensionRow[]) => entries.forEach(entry => rows.push([dimension, statisticLabel(getAggregateDimensionKey(entry)), entry.total, `${getStatisticShare(entry.total, data.totalRecords)}%`]));
  append("Cohort", data.byCohort); append("Completion status", data.byCompleteness); append("Enrollment status", data.byEnrollment); append("Data quality", data.byDataQuality);
  const coverageRows: Array<[string, number]> = [["Radiology recorded", data.investigationCoverage.radiologyRecorded], ["Laboratory recorded", data.investigationCoverage.laboratoryRecorded], ["Neurological recorded", data.investigationCoverage.neurologicalRecorded], ["Protocol checklist complete", data.investigationCoverage.protocolChecklistComplete]];
  coverageRows.forEach(([label, value]) => rows.push(["Investigation coverage", label, value, `${getStatisticShare(value, data.totalRecords)}%`]));
  appendIndicatorRows(rows, data.cohortIndicators);
  return [`# Registration date range (UTC): ${currentDateRangeLabel}`, "Dimension,Category,Count,Share", ...rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
}
export function downloadAggregateStatisticsCsv(csv: string) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const date = new Date().toISOString().slice(0, 10);
  link.download = csv.includes("# Comparison registration date range (UTC):") ? `registry-comparison-report-${date}.csv` : `registry-aggregate-statistics-${date}.csv`;
  document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
export function getStatisticsChartPngFileName(title: string, date = new Date()) {
  const stem = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aggregate-chart";
  return `registry-statistics-${stem}-${date.toISOString().slice(0, 10)}.png`;
}
export async function downloadStatisticsChartPng(target: HTMLElement, title: string) {
  const dataUrl = await toPng(target, { backgroundColor: "#ffffff", cacheBust: true, pixelRatio: 2 });
  const link = document.createElement("a");
  link.href = dataUrl; link.download = getStatisticsChartPngFileName(title);
  document.body.appendChild(link); link.click(); link.remove();
}

function ChartPngExport({ chartId, title }: { chartId: string; title: string }) {
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [error, setError] = React.useState("");
  const handleExport = async () => {
    const chart = document.getElementById(chartId);
    if (!chart) { setError("The chart could not be prepared. Please try again."); return; }
    setError(""); setIsPreparing(true);
    try { await downloadStatisticsChartPng(chart, title); }
    catch { setError("The chart could not be prepared. Please try again."); }
    finally { setIsPreparing(false); }
  };
  return <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" size="sm" variant="outline" className="border-[#b8dcd5] text-[#22636a]" disabled={isPreparing} onClick={handleExport}>{isPreparing ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ImageDown className="mr-2 h-3.5 w-3.5" />}{isPreparing ? "Preparing PNG…" : "Export PNG"}</Button>{error ? <p role="status" className="text-xs text-rose-700">{error}</p> : <p className="text-xs text-slate-500">Exports this aggregate chart only.</p>}</div>;
}

function ChartHelp({ label, children }: { label: string; children: React.ReactNode }) {
  return <Tooltip><TooltipTrigger asChild><button type="button" aria-label={`Help for ${label}`} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#51767a] outline-none transition-colors hover:bg-[#e6f4f0] hover:text-[#1f6965] focus-visible:ring-2 focus-visible:ring-[#2d7a73]"><Info className="h-4 w-4" aria-hidden="true" /></button></TooltipTrigger><TooltipContent side="top" sideOffset={6} className="max-w-64 bg-[#1d3c46] text-white">{children}</TooltipContent></Tooltip>;
}

function ComparisonSignal({ current, comparison, percentagePoints = false }: { current: number; comparison: number; percentagePoints?: boolean }) {
  const signal = getComparisonSignal(current, comparison);
  const Icon = signal.difference > 0 ? ArrowUp : signal.difference < 0 ? ArrowDown : Minus;
  const differenceLabel = percentagePoints ? getPercentagePointDifferenceLabel(current, comparison) : getStatisticDifferenceLabel(current, comparison);
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${signal.className}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{signal.label}: {differenceLabel}</span>;
}

function AggregateDonutChart({ title, description, data, total, selectedKey, onSelect, dateRangeLabel }: { title: string; description: string; data: AggregateChartDatum[]; total: number; selectedKey: string; onSelect: (key: string) => void; dateRangeLabel: string }) {
  const chartId = React.useId();
  return <Card className="border-[#e1e9e5] shadow-sm"><CardHeader className="pb-1"><div className="flex items-start justify-between gap-2"><CardTitle className="text-base text-[#24434b]">{title}</CardTitle><ChartHelp label={title}>Hover a chart segment for its aggregate count and share. Select a category below to filter this aggregate view.</ChartHelp></div><CardDescription>{description}</CardDescription></CardHeader><CardContent><div id={chartId} className="rounded-xl bg-[#fbfefd] p-2"><p className="px-2 pt-1 text-sm font-semibold text-[#24434b]">{title}</p><p className="px-2 pt-1 text-[11px] text-[#587579]">Registration date (UTC): {dateRangeLabel}</p><ChartContainer config={chartConfig} className="mx-auto h-[230px] max-w-[310px]"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${value} records (${getStatisticShare(Number(value), total)}%)`} />} /><Pie data={data} dataKey="total" nameKey="label" innerRadius={59} outerRadius={92} paddingAngle={3} strokeWidth={0}>{data.map(item => <Cell key={item.key} fill={item.color} />)}</Pie><text x="50%" y="47%" textAnchor="middle" className="fill-[#1d3c46] text-2xl font-semibold">{total}</text><text x="50%" y="58%" textAnchor="middle" className="fill-[#68807e] text-[10px] font-medium">MATCHING RECORDS</text></PieChart></ChartContainer><div className="grid gap-1.5 px-2 pb-2 text-xs text-[#45616a]">{data.map(item => <div key={item.key} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span><span className="font-medium tabular-nums">{item.total} · {getStatisticShare(item.total, total)}%</span></div>)}</div></div><div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label={`${title} interactive filters`}>{data.map(item => <button key={item.key} type="button" onClick={() => onSelect(item.key)} aria-pressed={selectedKey === item.key} className={`flex min-h-10 items-center justify-between gap-2 rounded-lg border px-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7a73] ${selectedKey === item.key ? "border-[#5fa397] bg-[#edf8f5] text-[#184a47]" : "border-[#e0ebe7] bg-white text-[#45616a] hover:bg-[#f4faf8]"}`}><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" /><span className="truncate">{item.label}</span></span><span className="font-semibold tabular-nums">{item.total} · {getStatisticShare(item.total, total)}%</span></button>)}</div><p className="mt-3 text-xs text-slate-500">Select a category above to apply its aggregate filter.</p><ChartPngExport chartId={chartId} title={title} /></CardContent></Card>;
}

function AggregateBarChart({ title, data, total, dateRangeLabel }: { title: string; data: AggregateChartDatum[]; total: number; dateRangeLabel: string }) {
  const chartId = React.useId();
  return <Card className="border-[#e1e9e5] shadow-sm"><CardHeader className="pb-2"><div className="flex items-start justify-between gap-2"><CardTitle className="text-base text-[#24434b]">{title}</CardTitle><ChartHelp label={title}>Hover a bar to see its aggregate count and share of all matching records.</ChartHelp></div><CardDescription>Counts and shares for the active aggregate view.</CardDescription></CardHeader><CardContent><div id={chartId} className="rounded-xl bg-[#fbfefd] p-2"><p className="px-2 pt-1 text-sm font-semibold text-[#24434b]">{title}</p><p className="px-2 pt-1 text-[11px] text-[#587579]">Registration date (UTC): {dateRangeLabel}</p><ChartContainer config={chartConfig} className="h-[230px] w-full"><BarChart accessibilityLayer data={data} margin={{ left: -14, right: 8, top: 8 }}><CartesianGrid vertical={false} stroke="#e7efec" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-18} textAnchor="end" height={64} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} /><ChartTooltip cursor={{ fill: "#edf7f4" }} content={<ChartTooltipContent formatter={(value) => `${value} (${getStatisticShare(Number(value), total)}%)`} />} /><Bar dataKey="total" fill="var(--color-total)" radius={[5, 5, 0, 0]} /></BarChart></ChartContainer></div><ChartPngExport chartId={chartId} title={title} /></CardContent></Card>;
}

function AggregateComparisonBarChart({ title, currentRows, comparisonRows, currentDateRangeLabel, comparisonDateRangeLabel }: { title: string; currentRows: AggregateDimensionRow[]; comparisonRows: AggregateDimensionRow[]; currentDateRangeLabel: string; comparisonDateRangeLabel: string }) {
  const chartId = React.useId();
  const data = toAggregateComparisonChartData(currentRows, comparisonRows);
  return <Card className="border-[#d7e4df] shadow-sm"><CardHeader className="pb-2"><div className="flex items-start justify-between gap-2"><CardTitle className="text-base text-[#24434b]">{title}</CardTitle><ChartHelp label={title}>Hover each pair of bars for the two aggregate counts. Rise, decrease, and no-change badges state the direction as well as the colour.</ChartHelp></div><CardDescription>Current period versus comparison period. Differences are current minus comparison.</CardDescription></CardHeader><CardContent><div id={chartId} className="rounded-xl bg-[#fbfefd] p-2"><p className="px-2 pt-1 text-sm font-semibold text-[#24434b]">{title}</p><div className="mt-1 grid gap-1 px-2 text-[11px] text-[#587579]"><span><span className="font-semibold text-[#22636a]">Current:</span> {currentDateRangeLabel}</span><span><span className="font-semibold text-[#685f98]">Comparison:</span> {comparisonDateRangeLabel}</span></div><ChartContainer config={chartConfig} className="h-[270px] w-full"><BarChart accessibilityLayer data={data} margin={{ left: -14, right: 8, top: 14 }}><CartesianGrid vertical={false} stroke="#e7efec" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-18} textAnchor="end" height={72} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} /><ChartTooltip cursor={{ fill: "#edf7f4" }} content={<ChartTooltipContent formatter={(value, name) => `${value} ${name === "comparison" ? "in comparison period" : "in current period"}`} />} /><Legend formatter={value => value === "current" ? "Current period" : "Comparison period"} /><Bar name="current" dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} /><Bar name="comparison" dataKey="comparison" fill="var(--color-comparison)" radius={[4, 4, 0, 0]} /></BarChart></ChartContainer><div className="grid gap-2 px-2 pb-2 text-xs text-[#45616a]">{data.map(item => <div key={item.key} className="flex flex-wrap items-center justify-between gap-2"><span>{item.label}</span><span className="flex flex-wrap items-center justify-end gap-1.5 font-medium tabular-nums"><span>{item.current} vs {item.comparison}</span><ComparisonSignal current={item.current} comparison={item.comparison} /></span></div>)}</div></div><ChartPngExport chartId={chartId} title={`${title} comparison`} /></CardContent></Card>;
}

function CohortIndicatorCard({ indicator, comparison, currentDateRangeLabel, comparisonDateRangeLabel }: { indicator: CohortClinicalIndicator; comparison?: CohortClinicalIndicator; currentDateRangeLabel: string; comparisonDateRangeLabel?: string }) {
  const chartId = React.useId();
  const isComparison = Boolean(comparison);
  const distribution = toCohortIndicatorDistributionComparison(indicator, comparison);
  const rateData = [{ label: "Rate", current: indicator.percentage, comparison: comparison?.percentage ?? 0 }];
  const difference = indicator.percentage - (comparison?.percentage ?? 0);
  return <Card className="border-[#d7e4df] shadow-sm"><CardHeader className="pb-2"><CardDescription>{cohorts.find(item => item.value === indicator.cohort)?.label ?? statisticLabel(indicator.cohort)}</CardDescription><CardTitle className="text-base text-[#24434b]">{indicator.title}</CardTitle></CardHeader><CardContent><div id={chartId} className="rounded-xl bg-[#fbfefd] p-3"><p className="text-sm font-semibold text-[#24434b]">{indicator.numeratorLabel}</p><p className="mt-1 text-xs leading-5 text-[#587579]">{indicator.denominatorLabel}</p><div className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-3"><span className="text-3xl font-semibold tracking-tight text-[#1d3c46]">{indicator.percentage}%</span><span className="text-xs text-[#587579]">{indicator.numerator} of {indicator.denominator}</span></div>{isComparison ? <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${difference > 0 ? "text-emerald-700" : difference < 0 ? "text-rose-700" : "text-slate-600"}`}>{difference > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : difference < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : null}{getPercentagePointDifferenceLabel(indicator.percentage, comparison?.percentage ?? 0)}</p> : null}<div className="mt-3 grid gap-1 text-[11px] text-[#587579]"><span><span className="font-semibold text-[#22636a]">Current:</span> {currentDateRangeLabel}</span>{isComparison ? <span><span className="font-semibold text-[#685f98]">Comparison:</span> {comparisonDateRangeLabel}</span> : null}</div><ChartContainer config={chartConfig} className="mt-2 h-[160px] w-full"><BarChart accessibilityLayer data={rateData} margin={{ left: -18, right: 8, top: 8 }}><CartesianGrid vertical={false} stroke="#e7efec" /><XAxis dataKey="label" hide /><YAxis domain={[0, 100]} tickFormatter={value => `${value}%`} tickLine={false} axisLine={false} width={40} /><ChartTooltip cursor={{ fill: "#edf7f4" }} content={<ChartTooltipContent formatter={(value, name) => `${value}% ${name === "comparison" ? "in comparison period" : "in current period"}`} />} />{isComparison ? <Legend formatter={value => value === "current" ? "Current period" : "Comparison period"} /> : null}<Bar name="current" dataKey="current" fill="var(--color-current)" radius={[5, 5, 0, 0]} />{isComparison ? <Bar name="comparison" dataKey="comparison" fill="var(--color-comparison)" radius={[5, 5, 0, 0]} /> : null}</BarChart></ChartContainer><div className="mt-2 border-t border-[#dfeae6] pt-2 text-xs text-[#45616a]" aria-label={`${indicator.title} aggregate distribution`}>{distribution.map(row => <div key={row.key} className="flex items-center justify-between gap-2 py-0.5"><span className="min-w-0 truncate">{row.label}</span><span className="shrink-0 font-medium tabular-nums">{isComparison ? `${row.currentPercentage}% vs ${row.comparisonPercentage}%` : `${row.currentPercentage}%`} · {isComparison ? getPercentagePointDifferenceLabel(row.currentPercentage, row.comparisonPercentage) : `${row.current} records`}</span></div>)}</div></div><ChartPngExport chartId={chartId} title={`${indicator.title} ${isComparison ? "comparison" : "rate"}`} /></CardContent></Card>;
}

function Metric({ label, value, description, comparisonValue }: { label: string; value: number; description: string; comparisonValue?: number }) {
  const difference = comparisonValue === undefined ? null : value - comparisonValue;
  return <Card className="border-[#e1e9e5] shadow-sm"><CardContent className="p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[#1d333f]">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>{difference !== null ? <p className={`mt-3 flex items-center gap-1 text-xs font-semibold ${difference > 0 ? "text-emerald-700" : difference < 0 ? "text-rose-700" : "text-slate-600"}`}>{difference > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : difference < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : null}{getStatisticDifferenceLabel(value, comparisonValue ?? 0)}</p> : null}</CardContent></Card>;
}

export default function RegistryStatistics() {
  const [cohort, setCohort] = React.useState<StatisticsCohort>("all");
  const [completeness, setCompleteness] = React.useState<CompletionStatus>("all");
  const [enrollment, setEnrollment] = React.useState<EnrollmentStatus>("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [comparisonStartDate, setComparisonStartDate] = React.useState("");
  const [comparisonEndDate, setComparisonEndDate] = React.useState("");
  const currentRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const comparisonPartial = Boolean(comparisonStartDate) !== Boolean(comparisonEndDate);
  const comparisonRangeInvalid = Boolean(comparisonStartDate && comparisonEndDate && comparisonStartDate > comparisonEndDate);
  const comparisonRequiresCurrentRange = Boolean((comparisonStartDate || comparisonEndDate) && (!startDate || !endDate));
  const sameRanges = Boolean(startDate && endDate && comparisonStartDate && comparisonEndDate && startDate === comparisonStartDate && endDate === comparisonEndDate);
  const hasInvalidDateRange = currentRangeInvalid || comparisonPartial || comparisonRangeInvalid || comparisonRequiresCurrentRange || sameRanges;
  const dateRangeError = currentRangeInvalid ? "The current period end date must be on or after its start date." : comparisonPartial ? "Enter both comparison dates." : comparisonRequiresCurrentRange ? "Choose both current-period dates before comparing periods." : comparisonRangeInvalid ? "The comparison end date must be on or after its start date." : sameRanges ? "Choose a different comparison period." : "";
  const currentDateRangeLabel = getStatisticsDateRangeLabel(startDate || undefined, endDate || undefined);
  const comparisonDateRangeLabel = getStatisticsDateRangeLabel(comparisonStartDate || undefined, comparisonEndDate || undefined);
  const comparisonEnabled = Boolean(comparisonStartDate && comparisonEndDate);
  const input = React.useMemo(() => ({ cohort: cohort === "all" ? undefined : cohort, completenessStatus: completeness === "all" ? undefined : completeness, enrollmentStatus: enrollment === "all" ? undefined : enrollment, startDate: startDate || undefined, endDate: endDate || undefined, comparisonStartDate: comparisonStartDate || undefined, comparisonEndDate: comparisonEndDate || undefined }), [cohort, completeness, enrollment, startDate, endDate, comparisonStartDate, comparisonEndDate]);
  const { data, isLoading, error } = trpc.registry.statistics.useQuery(input, { enabled: !hasInvalidDateRange });
  const statistics = data as AggregateStatistics | undefined;
  const comparison = statistics?.comparison;
  const total = statistics?.totalRecords ?? 0;
  const completed = statistics?.byCompleteness.find(row => row.status === "complete")?.total ?? 0;
  const comparisonCompleted = comparison?.byCompleteness.find(row => row.status === "complete")?.total;
  const cohortRows = toAggregateChartData(statistics?.byCohort, "cohort");
  const completionRows = toAggregateChartData(statistics?.byCompleteness, "completion");
  const enrollmentRows = toAggregateChartData(statistics?.byEnrollment);
  const qualityRows = toAggregateChartData(statistics?.byDataQuality);
  const activeComparison = comparisonEnabled ? comparison : undefined;
  const comparisonIndicators = new Map((activeComparison?.cohortIndicators ?? []).map(indicator => [indicator.id, indicator]));
  const displayedIndicators = (statistics?.cohortIndicators ?? []).filter(indicator => indicator.denominator > 0 || (comparisonIndicators.get(indicator.id)?.denominator ?? 0) > 0);
  const clearFilters = () => { setCohort("all"); setCompleteness("all"); setEnrollment("all"); setStartDate(""); setEndDate(""); setComparisonStartDate(""); setComparisonEndDate(""); };
  const noFiltersApplied = cohort === "all" && completeness === "all" && enrollment === "all" && !startDate && !endDate && !comparisonStartDate && !comparisonEndDate;
  const hasAnyMatchingData = total > 0 || (comparison?.totalRecords ?? 0) > 0;
  return <div className="mx-auto max-w-7xl space-y-6 fade-rise"><section className="rounded-[1.5rem] border border-[#dce9e5] bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#397a72]"><BarChart3 className="h-4 w-4" />AGGREGATE RESEARCH ANALYTICS</div><h1 className="mt-2 font-display text-3xl text-[#1d3c46]">Registry statistics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Explore aggregate research operations without displaying Research IDs, patient details, clinical narratives, user identities, or free text.</p></div><Button variant="outline" className="border-[#b8dcd5] text-[#22636a]" disabled={!statistics || isLoading || hasInvalidDateRange} onClick={() => statistics && downloadAggregateStatisticsCsv(createAggregateStatisticsCsv(statistics, currentDateRangeLabel, activeComparison, activeComparison ? comparisonDateRangeLabel : undefined))}><Download className="mr-2 h-4 w-4" />Download aggregate CSV</Button></div></section><section className="rounded-2xl border border-[#dce9e5] bg-[#f6fbf9] p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div><label htmlFor="statistics-cohort" className="mb-1.5 block text-xs font-medium text-[#45616a]">Cohort</label><Select value={cohort} onValueChange={value => setCohort(value as StatisticsCohort)}><SelectTrigger id="statistics-cohort"><SelectValue /></SelectTrigger><SelectContent>{cohorts.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div><label htmlFor="statistics-completeness" className="mb-1.5 block text-xs font-medium text-[#45616a]">Completion status</label><Select value={completeness} onValueChange={value => setCompleteness(value as CompletionStatus)}><SelectTrigger id="statistics-completeness"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All completion states</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="incomplete">Incomplete</SelectItem><SelectItem value="needs_review">Needs review</SelectItem></SelectContent></Select></div><div><label htmlFor="statistics-enrollment" className="mb-1.5 block text-xs font-medium text-[#45616a]">Enrollment status</label><Select value={enrollment} onValueChange={value => setEnrollment(value as EnrollmentStatus)}><SelectTrigger id="statistics-enrollment"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All enrollment states</SelectItem><SelectItem value="screened">Screened</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem><SelectItem value="ineligible">Ineligible</SelectItem></SelectContent></Select></div><div className="flex items-end"><Button variant="outline" className="w-full" onClick={clearFilters} disabled={noFiltersApplied}><FilterX className="mr-2 h-4 w-4" />Clear filters</Button></div></div><div className="mt-4 grid gap-3 border-t border-[#dce9e5] pt-4 md:grid-cols-2 xl:grid-cols-4"><div><label htmlFor="statistics-start-date" className="mb-1.5 block text-xs font-medium text-[#45616a]">Current period from (UTC)</label><Input id="statistics-start-date" type="date" value={startDate} max={endDate || undefined} onChange={event => setStartDate(event.target.value)} aria-invalid={hasInvalidDateRange} aria-describedby={hasInvalidDateRange ? "statistics-date-range-error" : undefined} /></div><div><label htmlFor="statistics-end-date" className="mb-1.5 block text-xs font-medium text-[#45616a]">Current period to (UTC)</label><Input id="statistics-end-date" type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} aria-invalid={hasInvalidDateRange} aria-describedby={hasInvalidDateRange ? "statistics-date-range-error" : undefined} /></div><div><label htmlFor="statistics-comparison-start-date" className="mb-1.5 block text-xs font-medium text-[#45616a]">Compare with period from (UTC)</label><Input id="statistics-comparison-start-date" type="date" value={comparisonStartDate} max={comparisonEndDate || undefined} onChange={event => setComparisonStartDate(event.target.value)} aria-invalid={hasInvalidDateRange} aria-describedby={hasInvalidDateRange ? "statistics-date-range-error" : undefined} /></div><div><label htmlFor="statistics-comparison-end-date" className="mb-1.5 block text-xs font-medium text-[#45616a]">Compare with period to (UTC)</label><Input id="statistics-comparison-end-date" type="date" value={comparisonEndDate} min={comparisonStartDate || undefined} onChange={event => setComparisonEndDate(event.target.value)} aria-invalid={hasInvalidDateRange} aria-describedby={hasInvalidDateRange ? "statistics-date-range-error" : undefined} /></div></div>{hasInvalidDateRange ? <p id="statistics-date-range-error" role="alert" className="mt-3 text-xs font-medium text-rose-700">{dateRangeError}</p> : <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-[#587579]"><CalendarRange className="h-3.5 w-3.5 shrink-0 text-[#277166]" />Use both dates for the current period, then optionally select both comparison dates. All dates are evaluated in UTC.</p>}<p className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-[#587579]"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#277166]" />Filters, comparisons, and cohort indicators affect aggregate counts only. Individual research records are not returned or exported by this page.</p></section>{hasInvalidDateRange ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-800">Correct the date ranges to update the aggregate statistics.</CardContent></Card> : error ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-800">Aggregate statistics are unavailable: {error.message}</CardContent></Card> : isLoading ? <section className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-36 rounded-xl" />)}</section> : <><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Matching records" value={total} description="Aggregate count for the current period." comparisonValue={comparison?.totalRecords} /><Metric label="Complete records" value={completed} description={`${getStatisticShare(completed, total)}% of the current aggregate view.`} comparisonValue={comparisonCompleted} /><Metric label="Protocol checklists complete" value={statistics?.investigationCoverage.protocolChecklistComplete ?? 0} description="Records with a completed or not-indicated checklist." comparisonValue={comparison?.investigationCoverage.protocolChecklistComplete} /><Metric label="Laboratory recorded" value={statistics?.investigationCoverage.laboratoryRecorded ?? 0} description="Aggregate coverage, not individual results." comparisonValue={comparison?.investigationCoverage.laboratoryRecorded} /></section>{displayedIndicators.length ? <section className="space-y-3"><div><h2 className="font-display text-2xl text-[#1d3c46]">Cohort indicators</h2><p className="mt-1 text-sm text-slate-500">Research-oriented rates derived from controlled cohort fields. Select a cohort above to focus on its indicator.</p></div><div className="grid gap-5 xl:grid-cols-2">{displayedIndicators.map(indicator => <CohortIndicatorCard key={indicator.id} indicator={indicator} comparison={comparisonIndicators.get(indicator.id)} currentDateRangeLabel={currentDateRangeLabel} comparisonDateRangeLabel={activeComparison ? comparisonDateRangeLabel : undefined} />)}</div></section> : null}{!hasAnyMatchingData ? <Card className="border-[#e1e9e5]"><CardContent className="p-8 text-center"><Microscope className="mx-auto h-8 w-8 text-[#5e928a]" /><h2 className="mt-3 font-display text-xl text-[#25424a]">No matching aggregate data</h2><p className="mt-2 text-sm text-slate-500">Adjust or clear the filters to review available registry statistics.</p></CardContent></Card> : activeComparison ? <section className="grid gap-5 xl:grid-cols-2"><AggregateComparisonBarChart title="Cohort distribution" currentRows={statistics?.byCohort ?? []} comparisonRows={activeComparison.byCohort} currentDateRangeLabel={currentDateRangeLabel} comparisonDateRangeLabel={comparisonDateRangeLabel} /><AggregateComparisonBarChart title="Completion status" currentRows={statistics?.byCompleteness ?? []} comparisonRows={activeComparison.byCompleteness} currentDateRangeLabel={currentDateRangeLabel} comparisonDateRangeLabel={comparisonDateRangeLabel} /><AggregateComparisonBarChart title="Enrollment status" currentRows={statistics?.byEnrollment ?? []} comparisonRows={activeComparison.byEnrollment} currentDateRangeLabel={currentDateRangeLabel} comparisonDateRangeLabel={comparisonDateRangeLabel} /><AggregateComparisonBarChart title="Data quality state" currentRows={statistics?.byDataQuality ?? []} comparisonRows={activeComparison.byDataQuality} currentDateRangeLabel={currentDateRangeLabel} comparisonDateRangeLabel={comparisonDateRangeLabel} /></section> : <section className="grid gap-5 xl:grid-cols-2"><AggregateDonutChart title="Cohort distribution" description="Select a cohort to update the aggregate view." data={cohortRows} total={total} selectedKey={cohort} onSelect={key => setCohort(key as StatisticsCohort)} dateRangeLabel={currentDateRangeLabel} /><AggregateDonutChart title="Completion status" description="Select a completion state to update the aggregate view." data={completionRows} total={total} selectedKey={completeness} onSelect={key => setCompleteness(key as CompletionStatus)} dateRangeLabel={currentDateRangeLabel} /><AggregateBarChart title="Enrollment status" data={enrollmentRows} total={total} dateRangeLabel={currentDateRangeLabel} /><AggregateBarChart title="Data quality state" data={qualityRows} total={total} dateRangeLabel={currentDateRangeLabel} /></section>}</>}</div>;
}
