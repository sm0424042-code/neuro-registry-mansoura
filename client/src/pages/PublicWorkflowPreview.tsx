import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  HeartPulse,
  Microscope,
  MessageSquare,
  Pill,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const brainVisual = "/manus-storage/mansoura-brain-imaging-overview_f9f978a6.png";

const workflows = [
  { icon: HeartPulse, title: "Stroke", tone: "bg-[#e8f6f3] text-[#28736a]", fields: ["NIHSS severity score and mRS outcome", "TOAST aetiology and dysphagia screen", "Stroke complication and functional outcome", "Discharge treatment"] },
  { icon: BrainCircuit, title: "Multiple Sclerosis", tone: "bg-[#eef1fb] text-[#59699a]", fields: ["EDSS and MSFC: 25-foot walk, 9-Hole Peg, PASAT-3", "Relapse activity and disease-modifying therapy", "Chest imaging, TB screen, and VZV immunity", "Infection-exclusion review and dated dose adherence"] },
  { icon: Microscope, title: "Abnormal Movements", tone: "bg-[#f8f1fa] text-[#83558b]", fields: ["Phenomenology and distribution", "Severity rating and functional impact", "Video / examination review", "Targeted imaging or testing"] },
  { icon: HeartPulse, title: "Guillain–Barré Syndrome", tone: "bg-[#eff7fb] text-[#4c7595]", fields: ["GBS disability score and MRC sum score", "Respiratory and autonomic status", "Electrodiagnostic pattern", "Immune-therapy pathway where relevant"] },
  { icon: HeartPulse, title: "Myasthenia Gravis", tone: "bg-[#fbf4e9] text-[#9a6e36]", fields: ["MGFA class and MG-ADL / QMG", "Ocular, bulbar, and respiratory evaluation", "Antibody / thymoma pathway", "Treatment response"] },
  { icon: BrainCircuit, title: "Myelopathy", tone: "bg-[#f0f5eb] text-[#5f7b4e]", fields: ["Functional disability and gait / mobility", "UMN / LMN signs and sensory level", "Bladder / bowel function", "Spine MRI and CSF pathway"] },
  { icon: Eye, title: "Neuro-ophthalmology", tone: "bg-[#fbf1e8] text-[#9c6b3c]", fields: ["Visual acuity, fields, and OCT", "Fundus / optic disc and RAPD", "NMOSD, MOGAD, and GCA classification", "AQP4/MOG and GCA pathway"] },
  { icon: Microscope, title: "CIDP & inflammatory neuropathy", tone: "bg-[#eff8f1] text-[#4d7d5c]", fields: ["Explicit CIDP variant: typical, MADSAM, distal, focal, motor, or sensory", "CIDP variant-pattern evaluation plus INCAT / ONLS and MRC sum score", "Sensory ataxia and EMG / NCS evidence", "Mononeuritis / vasculitic pathway, CSF, and immune-therapy safety"] },
] as const;

export default function PublicWorkflowPreview() {
  return (
    <main className="min-h-screen bg-[#f6faf8] text-[#203943]">
      <section className="relative overflow-hidden bg-[#091d30] px-5 py-8 text-white md:px-10 md:py-12">
        <img src={brainVisual} alt="Abstract non-patient-specific brain MRI visual" className="pointer-events-none absolute right-0 top-0 hidden h-full w-[35%] object-cover opacity-50 mix-blend-screen lg:block" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#c6f1e6]"><ShieldCheck className="h-3.5 w-3.5" />PUBLIC, NON-PATIENT DEMONSTRATION</div>
            <a href="/records/new" className="text-sm text-[#c6f1e6] underline-offset-4 hover:underline">Return to secure access</a>
          </div>
          <h1 className="mt-7 max-w-3xl font-display text-3xl leading-tight md:text-5xl">Mansoura University Neurology Research Registry</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">A view of the new clinical workflow structure. This page contains no patient records, sample cases, identities, contact details, or live registry data.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 md:px-10 md:py-12">
        <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-[#d5e8e3] bg-[#eff9f6]"><CardContent className="p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8f0e9] text-[#26736a]"><ClipboardCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#3a7a72]">WHAT WAS ADDED</p><h2 className="font-display text-2xl text-[#1e444c]">Cohort-specific clinical capture</h2></div></div>
            <p className="mt-5 text-sm leading-6 text-[#4b6b6e]">There is no standard evaluation checklist shared across diseases. Each pathway exposes only its own relevant clinical, investigation, treatment, and follow-up fields for the selected neurology cohort.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Badge className="bg-white text-[#28736a] hover:bg-white">8 neurology cohorts</Badge><Badge className="bg-white text-[#28736a] hover:bg-white">No direct identifiers</Badge><Badge className="bg-white text-[#28736a] hover:bg-white">Protected records</Badge></div>
          </CardContent></Card>
          <Card className="border-[#dce8e4]"><CardContent className="p-6">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#63807e]">RESEARCH-SAFE RECORD FLOW</p>
            <ol className="mt-5 space-y-3 text-sm text-slate-600"><PreviewStep number="1" label="MUNR Research ID and consent" /><PreviewStep number="2" label="Brief history and positive findings" /><PreviewStep number="3" label="Cohort-specific clinical evaluation" /><PreviewStep number="4" label="Protocol investigations and treatment safety" /><PreviewStep number="5" label="Completion ownership and follow-up" /></ol>
          </CardContent></Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-[#cfe5dd] bg-[#f0f9f6]"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8f0e9] text-[#26736a]"><MessageSquare className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#3a7a72]">APPROVED-USER MESSAGING</p><h2 className="font-display text-2xl text-[#1e444c]">Direct work conversations, separate from records</h2></div></div><p className="mt-4 text-sm leading-6 text-[#4b6b6e]">Approved registry users can communicate directly about operational research work. Messages are never connected to a research record, exported with registry data, or presented on this public page.</p><a href="/messages" className="mt-6 inline-flex items-center rounded-md bg-[#17616c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#104f58]">Open secure messages<ArrowRight className="ml-2 h-4 w-4" /></a></CardContent></Card>
          <Card className="border-[#dce8e4]"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff6e9] text-[#97652b]"><UsersRound className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#6d7977]">MESSAGE BOUNDARIES</p><h2 className="font-display text-2xl text-[#24434b]">How the protected chat works</h2></div></div><ol className="mt-5 space-y-3 text-sm leading-6 text-[#4b6669]"><PreviewStep number="1" label="Only approved registry users can appear as direct-message recipients." /><PreviewStep number="2" label="The conversation has no patient, Research ID, file, or clinical-record link." /><PreviewStep number="3" label="The app blocks MUNR IDs and obvious patient or contact identifiers in English and Arabic." /></ol><div className="mt-5 flex gap-3 rounded-xl border border-[#f0d8bb] bg-[#fff8ef] p-4 text-sm leading-6 text-[#805824]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Do not place patient information, names, contact details, addresses, dates of birth, national or medical-record numbers, MUNR Research IDs, report text, or clinical record details in messages. Use the secure record workflow for research data.</p></div></CardContent></Card>
        </section>

        <section>
          <div className="mb-4"><p className="text-[10px] font-bold tracking-[0.15em] text-[#47827a]">NEW CLINICAL PATHWAYS</p><h2 className="mt-1 font-display text-3xl text-[#1d3c46]">Visible form sections after secure sign-in</h2></div>
          <div className="grid gap-4 md:grid-cols-2">{workflows.map(({ icon: Icon, title, tone, fields }) => <Card key={title} className="border-[#e0ebe7] shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><h3 className="font-display text-xl text-[#25434b]">{title}</h3></div><div className="mt-5 space-y-3">{fields.map(field => <div key={field} className="flex gap-3 rounded-xl border border-[#e7efec] bg-[#fbfdfc] p-3 text-sm text-[#496467]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ba58e]" />{field}</div>)}</div></CardContent></Card>)}</div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="border-[#dce8e4]"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5fa] text-[#4c7798]"><FileText className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#5d7a84]">COMMON RECORD SECTIONS</p><h2 className="font-display text-2xl text-[#24434b]">Kept separate from clinical data</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><PreviewField label="Brief clinical history" /><PreviewField label="Positive examination findings" /><PreviewField label="Discharge treatment" /><PreviewField label="Completion owner and missing items" /><PreviewField label="Secure investigation files" /><PreviewField label="Longitudinal follow-up" /></div></CardContent></Card>
          <Card className="border-[#cfe5dd] bg-[#f0f9f6]"><CardContent className="p-6"><Pill className="h-6 w-6 text-[#28736a]" /><p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#3c7b72]">IMMUNE-THERAPY SAFETY</p><h2 className="mt-2 font-display text-2xl text-[#21464d]">Pre-therapy infection-exclusion review</h2><p className="mt-3 text-sm leading-6 text-[#557377]">The protected form now records chest imaging, tuberculin / IGRA TB screening, and varicella immunity (VZV immunoglobulin / serology) as protocol items with a status and research-safe note before relevant immune therapy. The treating team determines which screening or referral is appropriate; this demonstration does not offer treatment advice.</p><a href="/records/new" className="mt-6 inline-flex items-center rounded-md bg-[#17616c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#104f58]">Open secure registry<ArrowRight className="ml-2 h-4 w-4" /></a></CardContent></Card>
        </section>
      </div>
    </main>
  );
}

function PreviewStep({ number, label }: { number: string; label: string }) { return <li className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e7f5f0] text-xs font-bold text-[#28736a]">{number}</span>{label}</li>; }
function PreviewField({ label }: { label: string }) { return <div className="rounded-xl border border-[#e6eeeb] bg-[#fbfdfc] px-4 py-3 text-sm text-[#567075]">{label}</div>; }
