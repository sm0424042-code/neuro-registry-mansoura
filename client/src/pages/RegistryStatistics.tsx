import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toPng } from "html-to-image";
import { BarChart3, CalendarRange, Download, FilterX, ImageDown, LoaderCircle, Microscope, ShieldCheck } from "lucide-react";
import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

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

const statusLabels: Record<string, string> = {
  complete: "Complete", incomplete: "Incomplete", needs_review: "Needs review", screened: "Screened", enrolled: "Enrolled", completed: "Completed", withdrawn: "Withdrawn", ineligible: "Ineligible", draft: "Draft", query: "Query",
};
const cohortColors = ["#197b8a", "#685f98", "#b96d45", "#69855b", "#805e85", "#48809a", "#9b7048", "#4a8d74"];
const completionColors: Record<string, string> = { complete: "#418c63", incomplete: "#ca8a3d", needs_review: "#477ca6" };
const chartConfig = { total: { label: "Records", color: "#287a73" } } satisfies ChartConfig;

export type AggregateStatistics = {
  totalRecords: number;
  byCohort: Array<{ cohort: string; total: number }>;
  byEnrollment: Array<{ status: string; total: number }>;
  byCompleteness: Array<{ status: string; total: number }>;
  byDataQuality: Array<{ status: string; total: number }>;
  investigationCoverage: { radiologyRecorded: number; laboratoryRecorded: number; neurologicalRecorded: number; protocolChecklistComplete: number };
};

export function getStatisticShare(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0; }
export function statisticLabel(value: string) { return statusLabels[value] ?? value.replaceAll("_", " "); }
export function getStatisticsDateRangeLabel(startDate?: string, endDate?: string) {
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `Up to ${endDate}`;
  return "All registration dates";
}
export function toAggregateChartData(rows: AggregateDimensionRow[] | undefined, palette: "cohort" | "completion" | "default" = "default"): AggregateChartDatum[] {
  return (rows ?? []).map((row, index) => {
    const key = row.cohort ?? row.status ?? "not_recorded";
    const color = palette === "cohort" ? cohortColors[index % cohortColors.length] : palette === "completion" ? completionColors[key] ?? "#718096" : "#287a73";
    return { key, label: statisticLabel(key), total: row.total, color };
  });
}
export function createAggregateStatisticsCsv(data: AggregateStatistics, dateRangeLabel = "All registration dates") {
  const rows: Array<[string, string, number, string]> = [["Records", "All matching records", data.totalRecords, "100%"]];
  const append = (dimension: string, entries: AggregateDimensionRow[]) => entries.forEach(entry => rows.push([dimension, statisticLabel(entry.cohort ?? entry.status ?? "Not recorded"), entry.total, `${getStatisticShare(entry.total, data.totalRecords)}%`]));
  append("Cohort", data.byCohort); append("Completion status", data.byCompleteness); append("Enrollment status", data.byEnrollment); append("Data quality", data.byDataQuality);
  const coverageRows: Array<[string, number]> = [["Radiology recorded", data.investigationCoverage.radiologyRecorded], ["Laboratory recorded", data.investigationCoverage.laboratoryRecorded], ["Neurological recorded", data.investigationCoverage.neurologicalRecorded], ["Protocol checklist complete", data.investigationCoverage.protocolChecklistComplete]];
  coverageRows.forEach(([label, value]) => rows.push(["Investigation coverage", label, value, `${getStatisticShare(value, data.totalRecords)}%`]));
  return [`# Registration date range (UTC): ${dateRangeLabel}`, "Dimension,Category,Count,Share", ...rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
}
export function downloadAggregateStatisticsCsv(csv: string) {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `registry-aggregate-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
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

function AggregateDonutChart({ title, description, data, total, selectedKey, onSelect, dateRangeLabel }: { title: string; description: string; data: AggregateChartDatum[]; total: number; selectedKey: string; onSelect: (key: string) => void; dateRangeLabel: string }) {
  const chartId = React.useId();
  return <Card className="border-[#e1e9e5] shadow-sm"><CardHeader className="pb-1"><CardTitle className="text-base text-[#24434b]">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div id={chartId} className="rounded-xl bg-[#fbfefd] p-2"><p className="px-2 pt-1 text-sm font-semibold text-[#24434b]">{title}</p><p className="px-2 pt-1 text-[11px] text-[#587579]">Registration date (UTC): {dateRangeLabel}</p><ChartContainer config={chartConfig} className="mx-auto h-[230px] max-w-[310px]"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${value} records (${getStatisticShare(Number(value), total)}%)`} />} /><Pie data={data} dataKey="total" nameKey="label" innerRadius={59} outerRadius={92} paddingAngle={3} strokeWidth={0}>{data.map(item => <Cell key={item.key} fill={item.color} />)}</Pie><text x="50%" y="47%" textAnchor="middle" className="fill-[#1d3c46] text-2xl font-semibold">{total}</text><text x="50%" y="58%" textAnchor="middle" className="fill-[#68807e] text-[10px] font-medium">MATCHING RECORDS</text></PieChart></ChartContainer><div className="grid gap-1.5 px-2 pb-2 text-xs text-[#45616a]">{data.map(item => <div key={item.key} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span><span className="font-medium tabular-nums">{item.total} · {getStatisticShare(item.total, total)}%</span></div>)}</div></div><div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label={`${title} interactive filters`}>{data.map(item => <button key={item.key} type="button" onClick={() => onSelect(item.key)} aria-pressed={selectedKey === item.key} className={`flex min-h-10 items-center justify-between gap-2 rounded-lg border px-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d7a73] ${selectedKey === item.key ? "border-[#5fa397] bg-[#edf8f5] text-[#184a47]" : "border-[#e0ebe7] bg-white text-[#45616a] hover:bg-[#f4faf8]"}`}><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" /><span className="truncate">{item.label}</span></span><span className="font-semibold tabular-nums">{item.total} · {getStatisticShare(item.total, total)}%</span></button>)}</div><p className="mt-3 text-xs text-slate-500">Select a category above to apply its aggregate filter.</p><ChartPngExport chartId={chartId} title={title} /></CardContent></Card>;
}

function AggregateBarChart({ title, data, total, dateRangeLabel }: { title: string; data: AggregateChartDatum[]; total: number; dateRangeLabel: string }) {
  const chartId = React.useId();
  return <Card className="border-[#e1e9e5] shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base text-[#24434b]">{title}</CardTitle><CardDescription>Counts and shares for the active aggregate view.</CardDescription></CardHeader><CardContent><div id={chartId} className="rounded-xl bg-[#fbfefd] p-2"><p className="px-2 pt-1 text-sm font-semibold text-[#24434b]">{title}</p><p className="px-2 pt-1 text-[11px] text-[#587579]">Registration date (UTC): {dateRangeLabel}</p><ChartContainer config={chartConfig} className="h-[230px] w-full"><BarChart accessibilityLayer data={data} margin={{ left: -14, right: 8, top: 8 }}><CartesianGrid vertical={false} stroke="#e7efec" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} angle={-18} textAnchor="end" height={64} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} /><ChartTooltip cursor={{ fill: "#edf7f4" }} content={<ChartTooltipContent formatter={(value) => `${value} (${getStatisticShare(Number(value), total)}%)`} />} /><Bar dataKey="total" fill="var(--color-total)" radius={[5, 5, 0, 0]} /></BarChart></ChartContainer></div><ChartPngExport chartId={chartId} title={title} /></CardContent></Card>;
}

function Metric({ label, value, description }: { label: string; value: number; description: string }) { return <Card className="border-[#e1e9e5] shadow-sm"><CardContent className="p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[#1d333f]">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></CardContent></Card>; }

export default function RegistryStatistics() {
  const [cohort, setCohort] = React.useState<StatisticsCohort>("all");
  const [completeness, setCompleteness] = React.useState<CompletionStatus>("all");
  const [enrollment, setEnrollment] = React.useState<EnrollmentStatus>("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const hasInvalidDateRange = Boolean(startDate && endDate && startDate > endDate);
  const dateRangeLabel = getStatisticsDateRangeLabel(startDate || undefined, endDate || undefined);
  const input = React.useMemo(() => ({ cohort: cohort === "all" ? undefined : cohort, completenessStatus: completeness === "all" ? undefined : completeness, enrollmentStatus: enrollment === "all" ? undefined : enrollment, startDate: startDate || undefined, endDate: endDate || undefined }), [cohort, completeness, enrollment, startDate, endDate]);
  const { data, isLoading, error } = trpc.registry.statistics.useQuery(input, { enabled: !hasInvalidDateRange });
  const total = data?.totalRecords ?? 0;
  const cohortRows = toAggregateChartData(data?.byCohort, "cohort");
  const completionRows = toAggregateChartData(data?.byCompleteness, "completion");
  const enrollmentRows = toAggregateChartData(data?.byEnrollment);
  const qualityRows = toAggregateChartData(data?.byDataQuality);
  const completed = data?.byCompleteness.find(row => row.status === "complete")?.total ?? 0;
  const clearFilters = () => { setCohort("all"); setCompleteness("all"); setEnrollment("all"); setStartDate(""); setEndDate(""); };
  const noFiltersApplied = cohort === "all" && completeness === "all" && enrollment === "all" && !startDate && !endDate;
  return <div className="mx-auto max-w-7xl space-y-6 fade-rise"><section className="rounded-[1.5rem] border border-[#dce9e5] bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#397a72]"><BarChart3 className="h-4 w-4" />AGGREGATE RESEARCH ANALYTICS</div><h1 className="mt-2 font-display text-3xl text-[#1d3c46]">Registry statistics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Explore aggregate research operations without displaying Research IDs, patient details, clinical narratives, user identities, or free text.</p></div><Button variant="outline" className="border-[#b8dcd5] text-[#22636a]" disabled={!data || isLoading || hasInvalidDateRange} onClick={() => data && downloadAggregateStatisticsCsv(createAggregateStatisticsCsv(data as AggregateStatistics, dateRangeLabel))}><Download className="mr-2 h-4 w-4" />Download aggregate CSV</Button></div></section><section className="rounded-2xl border border-[#dce9e5] bg-[#f6fbf9] p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"><div><label htmlFor="statistics-cohort" className="mb-1.5 block text-xs font-medium text-[#45616a]">Cohort</label><Select value={cohort} onValueChange={value => setCohort(value as StatisticsCohort)}><SelectTrigger id="statistics-cohort"><SelectValue /></SelectTrigger><SelectContent>{cohorts.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div><label htmlFor="statistics-completeness" className="mb-1.5 block text-xs font-medium text-[#45616a]">Completion status</label><Select value={completeness} onValueChange={value => setCompleteness(value as CompletionStatus)}><SelectTrigger id="statistics-completeness"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All completion states</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="incomplete">Incomplete</SelectItem><SelectItem value="needs_review">Needs review</SelectItem></SelectContent></Select></div><div><label htmlFor="statistics-enrollment" className="mb-1.5 block text-xs font-medium text-[#45616a]">Enrollment status</label><Select value={enrollment} onValueChange={value => setEnrollment(value as EnrollmentStatus)}><SelectTrigger id="statistics-enrollment"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All enrollment states</SelectItem><SelectItem value="screened">Screened</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem><SelectItem value="ineligible">Ineligible</SelectItem></SelectContent></Select></div><div><label htmlFor="statistics-start-date" className="mb-1.5 block text-xs font-medium text-[#45616a]">Registration date from (UTC)</label><Input id="statistics-start-date" type="date" value={startDate} max={endDate || undefined} onChange={event => setStartDate(event.target.value)} aria-invalid={hasInvalidDateRange} aria-describedby={hasInvalidDateRange ? "statistics-date-range-error" : undefined} /></div><div><label htmlFor="statistics-end-date" className="mb-1.5 block text-xs font-medium text-[#45616a]">Registration date to (UTC)</label><Input id="statistics-end-date" type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} aria-invalid={hasInvalidDateRange} aria-describedby={hasInvalidDateRange ? "statistics-date-range-error" : undefined} /></div><div className="flex items-end"><Button variant="outline" className="w-full" onClick={clearFilters} disabled={noFiltersApplied}><FilterX className="mr-2 h-4 w-4" />Clear filters</Button></div></div>{hasInvalidDateRange ? <p id="statistics-date-range-error" role="alert" className="mt-3 text-xs font-medium text-rose-700">The end date must be on or after the start date.</p> : <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-[#587579]"><CalendarRange className="h-3.5 w-3.5 shrink-0 text-[#277166]" />Registration dates are evaluated in UTC. The selected period applies to cards, charts, PNG exports, and the aggregate CSV.</p>}<p className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-[#587579]"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#277166]" />Filters affect aggregate counts only. Individual research records are not returned or exported by this page.</p></section>{hasInvalidDateRange ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-800">Correct the registration date range to update the aggregate statistics.</CardContent></Card> : error ? <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm text-rose-800">Aggregate statistics are unavailable: {error.message}</CardContent></Card> : isLoading ? <section className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-36 rounded-xl" />)}</section> : <><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Matching records" value={total} description="Aggregate count for the active filters." /><Metric label="Complete records" value={completed} description={`${getStatisticShare(completed, total)}% of the active aggregate view.`} /><Metric label="Protocol checklists complete" value={data?.investigationCoverage.protocolChecklistComplete ?? 0} description="Records with a completed or not-indicated checklist." /><Metric label="Laboratory recorded" value={data?.investigationCoverage.laboratoryRecorded ?? 0} description="Aggregate coverage, not individual results." /></section>{total === 0 ? <Card className="border-[#e1e9e5]"><CardContent className="p-8 text-center"><Microscope className="mx-auto h-8 w-8 text-[#5e928a]" /><h2 className="mt-3 font-display text-xl text-[#25424a]">No matching aggregate data</h2><p className="mt-2 text-sm text-slate-500">Adjust or clear the filters to review available registry statistics.</p></CardContent></Card> : <section className="grid gap-5 xl:grid-cols-2"><AggregateDonutChart title="Cohort distribution" description="Select a cohort to update the aggregate view." data={cohortRows} total={total} selectedKey={cohort} onSelect={key => setCohort(key as StatisticsCohort)} dateRangeLabel={dateRangeLabel} /><AggregateDonutChart title="Completion status" description="Select a completion state to update the aggregate view." data={completionRows} total={total} selectedKey={completeness} onSelect={key => setCompleteness(key as CompletionStatus)} dateRangeLabel={dateRangeLabel} /><AggregateBarChart title="Enrollment status" data={enrollmentRows} total={total} dateRangeLabel={dateRangeLabel} /><AggregateBarChart title="Data quality state" data={qualityRows} total={total} dateRangeLabel={dateRangeLabel} /></section>}</>}</div>;
}
