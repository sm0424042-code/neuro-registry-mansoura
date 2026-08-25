import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ClipboardCheck, FilePenLine, Info, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Cohort = "stroke" | "myasthenia_gravis" | "guillain_barre" | "myopathy";
type FormState = {
  researchId: string; cohort: Cohort; sex: "female" | "male" | "intersex" | "not_recorded";
  ageAtEnrollment: string; ageAtOnset: string; consentStatus: "consented" | "pending" | "declined" | "withdrawn";
  enrollmentStatus: "screened" | "enrolled" | "completed" | "withdrawn" | "ineligible";
  clinicalStatus: "active" | "follow_up" | "completed" | "deceased" | "unknown";
  primaryDiagnosis: string; dataQualityStatus: "draft" | "complete" | "query"; clinicalData: Record<string, string>;
};
type Choice = [string, string];
type ClinicalField = { key: string; label: string; choices?: Choice[]; max?: number };

const cohortLabels: Record<Cohort, string> = { stroke: "Stroke", myasthenia_gravis: "Myasthenia Gravis", guillain_barre: "Guillain–Barré Syndrome", myopathy: "Myopathy" };
const cohortFields: Record<Cohort, ClinicalField[]> = {
  stroke: [
    { key: "strokeType", label: "Stroke type", choices: [["ischemic", "Ischemic"], ["hemorrhagic", "Haemorrhagic"], ["tia", "TIA"], ["other", "Other"], ["unknown", "Unknown"]] },
    { key: "vascularTerritory", label: "Vascular territory", choices: [["anterior", "Anterior"], ["posterior", "Posterior"], ["multiple", "Multiple"], ["unknown", "Unknown"]] },
    { key: "nihssAtPresentation", label: "NIHSS at presentation", max: 42 }, { key: "mRsAtDischarge", label: "mRS at discharge", max: 6 },
    { key: "reperfusionTherapy", label: "Reperfusion therapy", choices: [["none", "None"], ["iv_thrombolysis", "IV thrombolysis"], ["mechanical_thrombectomy", "Mechanical thrombectomy"], ["both", "Both"], ["unknown", "Unknown"]] },
    { key: "toastEtiology", label: "TOAST aetiology", choices: [["large_artery", "Large artery"], ["cardioembolic", "Cardioembolic"], ["small_vessel", "Small vessel"], ["other_determined", "Other determined"], ["undetermined", "Undetermined"], ["unknown", "Unknown"]] },
  ],
  myasthenia_gravis: [
    { key: "mgfaClass", label: "MGFA class", choices: [["I", "Class I"], ["II", "Class II"], ["III", "Class III"], ["IV", "Class IV"], ["V", "Class V"], ["unknown", "Unknown"]] },
    { key: "antibodyStatus", label: "Antibody status", choices: [["achr", "AChR"], ["musk", "MuSK"], ["lrp4", "LRP4"], ["seronegative", "Seronegative"], ["unknown", "Unknown"]] },
    { key: "thymomaStatus", label: "Thymoma status", choices: [["present", "Present"], ["absent", "Absent"], ["not_assessed", "Not assessed"], ["unknown", "Unknown"]] },
    { key: "myasthenicCrisis", label: "Myasthenic crisis", choices: [["never", "Never"], ["past", "Past"], ["current", "Current"], ["unknown", "Unknown"]] },
    { key: "treatmentClass", label: "Treatment class", choices: [["symptomatic", "Symptomatic"], ["immunosuppression", "Immunosuppression"], ["biologic", "Biologic"], ["thymectomy", "Thymectomy"], ["none", "None"], ["unknown", "Unknown"]] },
  ],
  guillain_barre: [
    { key: "gbsVariant", label: "GBS variant", choices: [["classical_aidp", "Classical AIDP"], ["aman", "AMAN"], ["amsan", "AMSAN"], ["miller_fisher", "Miller Fisher"], ["other", "Other"], ["unknown", "Unknown"]] },
    { key: "hughesDisabilityScore", label: "Hughes disability score", max: 6 },
    { key: "ventilatorySupport", label: "Ventilatory support", choices: [["none", "None"], ["non_invasive", "Non-invasive"], ["invasive", "Invasive"], ["unknown", "Unknown"]] },
    { key: "antecedentInfection", label: "Antecedent infection", choices: [["yes", "Yes"], ["no", "No"], ["unknown", "Unknown"]] },
    { key: "treatment", label: "Treatment", choices: [["ivig", "IVIG"], ["plasmapheresis", "Plasmapheresis"], ["both", "Both"], ["supportive", "Supportive"], ["unknown", "Unknown"]] },
  ],
  myopathy: [
    { key: "myopathySubtype", label: "Myopathy subtype", choices: [["inflammatory", "Inflammatory"], ["genetic", "Genetic"], ["metabolic", "Metabolic"], ["muscular_dystrophy", "Muscular dystrophy"], ["mitochondrial", "Mitochondrial"], ["endocrine_toxic", "Endocrine / toxic"], ["other", "Other"], ["unknown", "Unknown"]] },
    { key: "geneticConfirmation", label: "Genetic confirmation", choices: [["confirmed", "Confirmed"], ["not_confirmed", "Not confirmed"], ["not_tested", "Not tested"], ["unknown", "Unknown"]] },
    { key: "ckLevel", label: "CK level", max: 200000 },
    { key: "muscleBiopsy", label: "Muscle biopsy", choices: [["yes", "Yes"], ["no", "No"], ["not_done", "Not done"], ["unknown", "Unknown"]] },
    { key: "cardiacInvolvement", label: "Cardiac involvement", choices: [["yes", "Yes"], ["no", "No"], ["unknown", "Unknown"]] },
  ],
};

function cohortDefaults(cohort: Cohort): Record<string, string> {
  return { cohort, ...Object.fromEntries(cohortFields[cohort].map(field => [field.key, field.choices ? "unknown" : ""])) };
}

const defaults: FormState = { researchId: "", cohort: "stroke", sex: "not_recorded", ageAtEnrollment: "", ageAtOnset: "", consentStatus: "pending", enrollmentStatus: "screened", clinicalStatus: "unknown", primaryDiagnosis: "", dataQualityStatus: "draft", clinicalData: cohortDefaults("stroke") };

export default function PatientEditor({ mode, recordId }: { mode: "create" | "edit"; recordId?: number }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(defaults);
  const { data: record, isLoading, error } = trpc.registry.get.useQuery({ id: recordId ?? 0 }, { enabled: mode === "edit" && Boolean(recordId) });
  const { data: audit } = trpc.registry.auditTrail.useQuery({ id: recordId ?? 0 }, { enabled: mode === "edit" && Boolean(recordId) });
  const create = trpc.registry.create.useMutation({ onSuccess: () => { utils.registry.list.invalidate(); utils.registry.overview.invalidate(); toast.success("Research record saved"); setLocation("/registry"); }, onError: issue => toast.error(issue.message) });
  const update = trpc.registry.update.useMutation({ onSuccess: () => { utils.registry.list.invalidate(); utils.registry.overview.invalidate(); toast.success("Research record updated"); setLocation("/registry"); }, onError: issue => toast.error(issue.message) });

  useEffect(() => {
    if (!record) return;
    setForm({ researchId: record.researchId, cohort: record.cohort, sex: record.sex, ageAtEnrollment: String(record.ageAtEnrollment), ageAtOnset: record.ageAtOnset === null ? "" : String(record.ageAtOnset), consentStatus: record.consentStatus, enrollmentStatus: record.enrollmentStatus, clinicalStatus: record.clinicalStatus, primaryDiagnosis: record.primaryDiagnosis, dataQualityStatus: record.dataQualityStatus, clinicalData: Object.fromEntries(Object.entries(record.clinicalData as Record<string, string | number | null>).map(([key, value]) => [key, value === null ? "" : String(value)])) });
  }, [record]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));
  const setCohort = (cohort: Cohort) => setForm(current => ({ ...current, cohort, clinicalData: cohortDefaults(cohort) }));
  const setClinical = (key: string, value: string) => setForm(current => ({ ...current, clinicalData: { ...current.clinicalData, [key]: value } }));
  const save = () => {
    const numeric = (value: string) => value === "" ? null : Number(value);
    const payload = { researchId: form.researchId, cohort: form.cohort, sex: form.sex, ageAtEnrollment: Number(form.ageAtEnrollment), ageAtOnset: numeric(form.ageAtOnset), consentStatus: form.consentStatus, enrollmentStatus: form.enrollmentStatus, clinicalStatus: form.clinicalStatus, primaryDiagnosis: form.primaryDiagnosis, dataQualityStatus: form.dataQualityStatus, clinicalData: buildClinicalData(form.cohort, form.clinicalData) };
    if (!Number.isInteger(payload.ageAtEnrollment)) { toast.error("Enter a valid age at enrolment."); return; }
    if (mode === "create") create.mutate(payload);
    else if (recordId) update.mutate({ id: recordId, ...payload });
  };
  if (mode === "edit" && isLoading) return <EditorLoading />;
  if (mode === "edit" && (error || !record)) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">This record could not be loaded. {error?.message}</div>;
  const saving = create.isPending || update.isPending;

  return <div className="mx-auto max-w-6xl space-y-6 fade-rise">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Button variant="ghost" className="-ml-3 text-slate-500 hover:text-[#1d5058]" onClick={() => setLocation("/registry")}><ArrowLeft className="mr-2 h-4 w-4" />Back to registry</Button><div className="mt-2 flex items-center gap-3"><h1 className="font-display text-3xl text-[#172b38]">{mode === "create" ? "New patient record" : form.researchId}</h1>{mode === "edit" && <Badge variant="outline" className="border-[#cce1dc] bg-[#eef8f5] text-[#2d716a]">Research record</Badge>}</div><p className="mt-2 text-sm text-slate-500">All fields are in English. Use the pseudonymised Research ID only.</p></div><Button onClick={save} disabled={saving} className="bg-[#125d69] hover:bg-[#0d4b55]"><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save record"}</Button></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_290px]"><div className="space-y-6"><PrivacyNotice /><FormCard icon={ClipboardCheck} eyebrow="RESEARCH IDENTITY" title="Core research record"><div className="grid gap-4 md:grid-cols-2"><Field label="Research ID" hint="Format: EGR-XXXX"><Input value={form.researchId} onChange={event => set("researchId", event.target.value.toUpperCase())} placeholder="EGR-2026A" /></Field><Field label="Neurological cohort"><Select value={form.cohort} onValueChange={value => setCohort(value as Cohort)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(cohortLabels) as Cohort[]).map(key => <SelectItem key={key} value={key}>{cohortLabels[key]}</SelectItem>)}</SelectContent></Select></Field><Field label="Primary diagnosis"><Input value={form.primaryDiagnosis} onChange={event => set("primaryDiagnosis", event.target.value)} placeholder="e.g., Ischaemic stroke" /></Field><Field label="Sex"><Select value={form.sex} onValueChange={value => set("sex", value as FormState["sex"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="female">Female</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="intersex">Intersex</SelectItem><SelectItem value="not_recorded">Not recorded</SelectItem></SelectContent></Select></Field><Field label="Age at enrolment"><Input type="number" min="0" max="120" value={form.ageAtEnrollment} onChange={event => set("ageAtEnrollment", event.target.value)} placeholder="Years" /></Field><Field label="Age at onset" hint="Optional"><Input type="number" min="0" max="120" value={form.ageAtOnset} onChange={event => set("ageAtOnset", event.target.value)} placeholder="Years" /></Field></div></FormCard><FormCard icon={ShieldCheck} eyebrow="STUDY GOVERNANCE" title="Consent and enrolment"><div className="grid gap-4 md:grid-cols-2"><Field label="Consent status"><Select value={form.consentStatus} onValueChange={value => set("consentStatus", value as FormState["consentStatus"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="consented">Consented</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="declined">Declined</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem></SelectContent></Select></Field><Field label="Enrolment status"><Select value={form.enrollmentStatus} onValueChange={value => set("enrollmentStatus", value as FormState["enrollmentStatus"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="screened">Screened</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem><SelectItem value="ineligible">Ineligible</SelectItem></SelectContent></Select></Field><Field label="Clinical status"><Select value={form.clinicalStatus} onValueChange={value => set("clinicalStatus", value as FormState["clinicalStatus"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="follow_up">Follow-up</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="deceased">Deceased</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select></Field><Field label="Data quality"><Select value={form.dataQualityStatus} onValueChange={value => set("dataQualityStatus", value as FormState["dataQualityStatus"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="query">Query</SelectItem></SelectContent></Select></Field></div></FormCard><ClinicalSection cohort={form.cohort} values={form.clinicalData} setValue={setClinical} /></div><aside className="space-y-4"><Card className="border-[#dce9e5] bg-[#f0f8f6]"><CardContent className="p-5"><p className="text-xs font-bold tracking-[0.13em] text-[#34736c]">DATA MINIMISATION</p><p className="mt-3 text-sm leading-6 text-[#426364]">Do not enter names, national ID numbers, contact details, addresses, hospital identifiers, or exact clinical dates.</p></CardContent></Card>{mode === "edit" && <AuditPanel audit={audit} />}</aside></div>
  </div>;
}

function buildClinicalData(cohort: Cohort, data: Record<string, string>) {
  const num = (key: string) => data[key] === "" ? null : Number(data[key]);
  if (cohort === "stroke") return { cohort, strokeType: data.strokeType as "ischemic" | "hemorrhagic" | "tia" | "other" | "unknown", vascularTerritory: data.vascularTerritory as "anterior" | "posterior" | "multiple" | "unknown", nihssAtPresentation: num("nihssAtPresentation"), mRsAtDischarge: num("mRsAtDischarge"), reperfusionTherapy: data.reperfusionTherapy as "none" | "iv_thrombolysis" | "mechanical_thrombectomy" | "both" | "unknown", toastEtiology: data.toastEtiology as "large_artery" | "cardioembolic" | "small_vessel" | "other_determined" | "undetermined" | "unknown" };
  if (cohort === "myasthenia_gravis") return { cohort, mgfaClass: data.mgfaClass as "I" | "II" | "III" | "IV" | "V" | "unknown", antibodyStatus: data.antibodyStatus as "achr" | "musk" | "lrp4" | "seronegative" | "unknown", thymomaStatus: data.thymomaStatus as "present" | "absent" | "not_assessed" | "unknown", myasthenicCrisis: data.myasthenicCrisis as "never" | "past" | "current" | "unknown", treatmentClass: data.treatmentClass as "symptomatic" | "immunosuppression" | "biologic" | "thymectomy" | "none" | "unknown" };
  if (cohort === "guillain_barre") return { cohort, gbsVariant: data.gbsVariant as "classical_aidp" | "aman" | "amsan" | "miller_fisher" | "other" | "unknown", hughesDisabilityScore: num("hughesDisabilityScore"), ventilatorySupport: data.ventilatorySupport as "none" | "non_invasive" | "invasive" | "unknown", antecedentInfection: data.antecedentInfection as "yes" | "no" | "unknown", treatment: data.treatment as "ivig" | "plasmapheresis" | "both" | "supportive" | "unknown" };
  return { cohort, myopathySubtype: data.myopathySubtype as "inflammatory" | "genetic" | "metabolic" | "muscular_dystrophy" | "mitochondrial" | "endocrine_toxic" | "other" | "unknown", geneticConfirmation: data.geneticConfirmation as "confirmed" | "not_confirmed" | "not_tested" | "unknown", ckLevel: num("ckLevel"), muscleBiopsy: data.muscleBiopsy as "yes" | "no" | "not_done" | "unknown", cardiacInvolvement: data.cardiacInvolvement as "yes" | "no" | "unknown" };
}

function PrivacyNotice() { return <div className="flex gap-3 rounded-xl border border-[#bcded7] bg-[#eaf7f3] p-4 text-sm text-[#1f5d57]"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Privacy checkpoint:</strong> this registry stores pseudonymised research data. The Research ID must not be derived from a patient name, national ID, or medical record number.</p></div>; }
function FormCard({ icon: Icon, eyebrow, title, children }: { icon: typeof ClipboardCheck; eyebrow: string; title: string; children: React.ReactNode }) { return <Card className="border-[#e1e9e5] shadow-sm"><CardContent className="p-6"><div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f4] text-[#2e716b]"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-bold tracking-[0.13em] text-[#63807b]">{eyebrow}</p><h2 className="mt-0.5 font-display text-xl text-[#203943]">{title}</h2></div></div>{children}</CardContent></Card>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <div><div className="mb-1.5 flex items-baseline justify-between"><Label>{label}</Label>{hint && <span className="text-[11px] text-slate-400">{hint}</span>}</div>{children}</div>; }
function ClinicalSection({ cohort, values, setValue }: { cohort: Cohort; values: Record<string, string>; setValue: (key: string, value: string) => void }) { return <FormCard icon={FilePenLine} eyebrow="COHORT-SPECIFIC DATA" title={cohortLabels[cohort]}><div className="grid gap-4 md:grid-cols-2">{cohortFields[cohort].map(field => field.choices ? <Field key={field.key} label={field.label}><Select value={values[field.key]} onValueChange={value => setValue(field.key, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{field.choices.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field> : <Field key={field.key} label={field.label} hint="Optional"><Input type="number" min="0" max={field.max} value={values[field.key]} onChange={event => setValue(field.key, event.target.value)} /></Field>)}</div></FormCard>; }
function AuditPanel({ audit }: { audit: { id: number; action: "created" | "updated" | "exported" | "access_changed"; fieldSummary: string; occurredAt: Date; actorName: string | null }[] | undefined }) { return <Card className="border-[#e1e9e5]"><CardContent className="p-5"><p className="text-xs font-bold tracking-[0.13em] text-[#68807d]">AUDIT TRAIL</p><div className="mt-4 space-y-4">{audit?.length ? audit.map(item => <div key={item.id} className="border-l-2 border-[#99cfc4] pl-3"><p className="text-xs font-semibold capitalize text-[#2e5960]">{item.action}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.fieldSummary}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(item.occurredAt).toLocaleString()}</p></div>) : <p className="text-xs leading-5 text-slate-500">No record activity is available yet.</p>}</div></CardContent></Card>; }
function EditorLoading() { return <div className="mx-auto max-w-6xl space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-72 w-full" /><Skeleton className="h-72 w-full" /></div>; }
