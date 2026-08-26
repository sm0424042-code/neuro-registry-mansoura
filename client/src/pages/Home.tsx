import { Button } from "@/components/ui/button";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowRight, BrainCircuit, ClipboardCheck, ClipboardPlus, Eye, FileWarning, HeartPulse, Image as ImageIcon, Microscope, ScanLine, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

const cohorts = [
  { key: "stroke", label: "Stroke", color: "bg-[#197b8a]" },
  { key: "multiple_sclerosis", label: "Multiple Sclerosis", color: "bg-[#685f98]" },
  { key: "abnormal_movements", label: "Abnormal Movements", color: "bg-[#b96d45]" },
  { key: "guillain_barre", label: "Guillain–Barré", color: "bg-[#69855b]" },
  { key: "myasthenia_gravis", label: "Myasthenia Gravis", color: "bg-[#805e85]" },
  { key: "myelopathy", label: "Myelopathy", color: "bg-[#48809a]" },
  { key: "neuro_ophthalmology", label: "Neuro-ophthalmology", color: "bg-[#9b7048]" },
  { key: "cidp", label: "CIDP", color: "bg-[#4a8d74]" },
] as const;
const brainVisual = "/manus-storage/mansoura-brain-imaging-overview_f9f978a6.png";

export default function Home() {
  const [, navigate] = useLocation();
  const { data, isLoading, error } = trpc.registry.overview.useQuery();
  const number = (kind: "complete" | "incomplete" | "needs_review") => data?.byCompleteness.find(row => row.status === kind)?.total ?? 0;
  const coverage = data?.investigationCoverage;

  return (
    <div className="mx-auto max-w-7xl space-y-6 fade-rise">
      <section className="relative overflow-hidden rounded-[1.65rem] border border-[#242a31] bg-[#050607] shadow-[0_28px_70px_rgba(0,0,0,0.34)]">
        <div className="absolute inset-0 [background:radial-gradient(circle_at_15%_5%,rgba(67,103,106,0.36)_0,transparent_27%),radial-gradient(circle_at_82%_85%,rgba(18,74,84,0.26)_0,transparent_34%)]" />
        <div className="absolute left-8 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#67cfc0]/40 to-transparent" />
        <div className="relative grid min-h-[400px] lg:grid-cols-[1.03fr_0.97fr]">
          <div className="flex flex-col justify-center px-6 py-9 text-white md:px-9 lg:py-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#4c6c6c] bg-[#101516] px-3 py-1 text-xs font-medium text-[#bce4dc]"><BrainCircuit className="h-3.5 w-3.5" />MANSOURA UNIVERSITY · NEUROLOGY</div>
            <h1 className="mt-5 max-w-xl font-display text-3xl leading-tight text-[#f5f8f7] md:text-4xl">Mansoura Neurology Research Registry</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#c5d0cf]">An accountable research workflow for Stroke, MS, CIDP, inflammatory neuropathy, movement disorders, myelopathy, and neuro-ophthalmology.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate("/records/new")} className="bg-[#d1f0e9] text-[#061114] shadow-[0_8px_26px_rgba(84,180,159,0.22)] hover:bg-[#e4faf5]"><ClipboardPlus className="mr-2 h-4 w-4" />Create research record</Button><Button variant="outline" onClick={() => navigate("/registry")} className="border-[#5b686a] bg-[#111719] text-[#eef5f3] hover:bg-[#1b2527] hover:text-white">Review registry<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
            <p className="mt-6 flex items-center gap-2 text-xs text-[#a9c7c1]"><ShieldCheck className="h-3.5 w-3.5" />Pseudonymised research data only · no direct identifiers</p>
          </div>
          <div className="relative min-h-[250px] border-t border-[#2d383a] bg-[#020303] lg:min-h-0 lg:border-l lg:border-t-0">
            <HomeHeroMedia />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,7,0.88)_0%,rgba(5,6,7,0.16)_52%,rgba(5,6,7,0.5)_100%)]" />
            <NeuralNetworkOverlay />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#536366] bg-[#080b0c]/85 px-4 py-3 shadow-2xl backdrop-blur-sm"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#b8eee2]/10 text-[#b8eee2]"><ImageIcon className="h-4 w-4" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#b8eee2]">NEURAL NETWORK CONTEXT</p><p className="mt-0.5 text-xs text-[#d2dddb]">Abstract visual — no patient image</p></div></div><span className="rounded-full border border-[#536366] bg-[#111719] px-2.5 py-1 text-[10px] font-medium text-[#e4efed]">NEUROLOGY</span></div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Registry overview unavailable: {error.message}</div> : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Activity} label="Research records" value={data?.total ?? 0} loading={isLoading} tone="teal" /><Metric icon={ShieldCheck} label="Complete records" value={number("complete")} loading={isLoading} tone="green" /><Metric icon={FileWarning} label="Items still missing" value={number("incomplete")} loading={isLoading} tone="amber" /><Metric icon={ShieldCheck} label="Needs clinical review" value={number("needs_review")} loading={isLoading} tone="blue" /></section>
        <section className="rounded-[1.4rem] border border-[#dce9e5] bg-white p-5 shadow-sm md:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold tracking-[0.15em] text-[#47827a]">CLINICAL WORKFLOW BOARD</p><h2 className="mt-1 font-display text-2xl text-[#1d3c46]">What this registry now captures</h2><p className="mt-2 text-sm text-slate-500">Cohort-specific evaluation replaces generic forms; unrelated fields stay hidden.</p></div><Button variant="outline" onClick={() => navigate("/records/new")} className="border-[#bbdcd4] text-[#22636a]">Open structured record<ArrowRight className="ml-2 h-4 w-4" /></Button></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><WorkflowCard icon={HeartPulse} title="Stroke & vascular" items={["Complications and discharge treatment", "ACA · MCA complete/incomplete", "NIHSS / mRS evaluation"]} /><WorkflowCard icon={BrainCircuit} title="MS & neuroimmunology" items={["DMT and MSFC components", "Chest imaging, TB and VZV review", "Dated dose-adherence events"]} /><WorkflowCard icon={Microscope} title="CIDP & vasculitic neuropathy" items={["Typical CIDP, MADSAM and variants", "Mononeuritis multiplex pathway", "Immune therapy and EMG/NCS"]} /><WorkflowCard icon={Eye} title="Neuro-ophthalmology" items={["NMOSD · MOGAD · GCA", "AQP4/MOG profile and OCT", "Relevant linked systemic disease"]} /><WorkflowCard icon={ClipboardCheck} title="Completion & follow-up" items={["History and positive findings", "Missing data ownership", "Research-ready completeness state"]} /></div></section>
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"><Card className="border-[#e1e9e5] shadow-sm"><CardContent className="p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-[#172b38]">Neurology cohort composition</p><p className="mt-1 text-xs text-slate-500">Live distribution across Mansoura University registry cohorts</p></div><span className="rounded-full bg-[#eef7f4] px-2.5 py-1 text-xs font-medium text-[#286069]">8 cohorts</span></div><div className="mt-7 grid gap-x-8 gap-y-5 md:grid-cols-2">{cohorts.map(cohort => { const count = data?.byCohort.find(row => row.cohort === cohort.key)?.total ?? 0; const share = data?.total ? Math.round((count / data.total) * 100) : 0; return <div key={cohort.key}><div className="flex items-center justify-between text-sm"><span className="font-medium text-[#30434c]">{cohort.label}</span><span className="text-slate-500">{count} <span className="text-slate-400">({share}%)</span></span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9efec]"><div className={`h-full rounded-full ${cohort.color}`} style={{ width: `${share}%` }} /></div></div>; })}</div></CardContent></Card><Card className="border-[#d6e7e2] bg-[#f1f9f7] shadow-sm"><CardContent className="p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#dff2ec] text-[#277166]"><ScanLine className="h-5 w-5" /></span><p className="mt-5 text-xs font-bold tracking-[0.14em] text-[#397b73]">INVESTIGATION COVERAGE</p><h3 className="mt-2 font-display text-2xl text-[#183f47]">Protocol readiness at a glance.</h3><div className="mt-5 grid grid-cols-2 gap-3"><Coverage label="Radiology" value={coverage?.radiologyRecorded ?? 0} /><Coverage label="Laboratory" value={coverage?.laboratoryRecorded ?? 0} /><Coverage label="Neurological" value={coverage?.neurologicalRecorded ?? 0} /><Coverage label="Protocol complete" value={coverage?.protocolChecklistComplete ?? 0} /></div><p className="mt-4 text-xs leading-5 text-[#567275]">{coverage?.protocolChecklistOutstanding ?? 0} record(s) have a protocol checklist in progress.</p><Button onClick={() => navigate("/registry")} variant="outline" className="mt-5 border-[#bbdcd4] bg-white text-[#22636a] hover:bg-[#f8fcfb]">Review incomplete records<ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card></section>
      </>}
    </div>
  );
}

function Metric({ icon: Icon, label, value, loading, tone }: { icon: typeof Activity; label: string; value: number; loading: boolean; tone: "teal" | "blue" | "amber" | "green" }) { const colors = { teal: "bg-[#e9f7f3] text-[#257161]", blue: "bg-[#eef3fa] text-[#3f668f]", amber: "bg-[#fff4e8] text-[#a96735]", green: "bg-[#eef7eb] text-[#597c50]" }; return <Card className="border-[#e1e9e5] shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p>{loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1d333f]">{value}</p>}</div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span></div></CardContent></Card>; }
export function HomeHeroMedia() { return <img src={brainVisual} alt="Abstract non-patient-specific neural-network brain visual" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.46] contrast-[1.28] grayscale" />; }
function Coverage({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-[#d3e6e0] bg-white/70 p-3"><p className="text-[11px] font-medium text-[#63807d]">{label}</p><p className="mt-1 text-xl font-semibold text-[#1f5860]">{value}</p></div>; }
function WorkflowCard({ icon: Icon, title, items }: { icon: typeof Activity; title: string; items: string[] }) { return <article className="rounded-xl border border-[#e5eeeb] bg-[#fbfdfc] p-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f6f1] text-[#28736a]"><Icon className="h-4 w-4" /></span><h3 className="mt-3 text-sm font-semibold text-[#24404a]">{title}</h3><ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-500">{items.map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#52aa94]" />{item}</li>)}</ul></article>; }
function NeuralNetworkOverlay() { const nodes = [[57, 16], [68, 12], [79, 18], [51, 28], [62, 31], [74, 29], [87, 34], [54, 44], [67, 46], [80, 43], [91, 51], [51, 59], [63, 62], [76, 59], [87, 66], [57, 76], [69, 79], [81, 75]]; const links = [[0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 7], [3, 8], [4, 8], [4, 9], [5, 9], [5, 10], [6, 10], [7, 11], [7, 12], [8, 12], [8, 13], [9, 13], [9, 14], [10, 14], [11, 15], [12, 15], [12, 16], [13, 16], [13, 17], [14, 17]]; return <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-80 mix-blend-screen"><g stroke="#63d7c5" strokeWidth="0.22" strokeOpacity="0.58">{links.map(([from, to]) => <line key={`${from}-${to}`} x1={nodes[from][0]} y1={nodes[from][1]} x2={nodes[to][0]} y2={nodes[to][1]} />)}</g><g fill="#a8f3e4">{nodes.map(([x, y], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 4 === 0 ? "1.15" : "0.72"} />)}</g></svg>; }
