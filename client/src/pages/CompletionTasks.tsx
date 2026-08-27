import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle2, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const cohortLabels: Record<string, string> = {
  stroke: "Stroke", multiple_sclerosis: "Multiple Sclerosis (MS)", abnormal_movements: "Abnormal Movements", guillain_barre: "Guillain–Barré Syndrome (GBS)", myasthenia_gravis: "Myasthenia Gravis (MG)", myelopathy: "Myelopathy", neuro_ophthalmology: "Neuro-ophthalmology", cidp: "CIDP",
};

export function getTaskStatusLabel(status: string) { return status === "reassigned" ? "Reassigned — accept again" : status.charAt(0).toUpperCase() + status.slice(1); }
export function getTaskNotificationLabel(eventType: string) {
  return ({ assigned: "A record-completion task was assigned.", accepted: "A record-completion task was accepted.", completed: "A record-completion task was marked complete.", reassigned: "A record-completion task was reassigned." } as Record<string, string>)[eventType] ?? "A protected task event occurred.";
}

function TaskStatus({ status }: { status: string }) {
  const tone = status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "accepted" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-200 bg-amber-50 text-amber-700";
  return <Badge variant="outline" className={tone}>{getTaskStatusLabel(status)}</Badge>;
}

export default function CompletionTasks() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const myTasks = trpc.completionTasks.mine.useQuery(undefined, { enabled: !isAdmin });
  const allTasks = trpc.completionTasks.all.useQuery(undefined, { enabled: isAdmin });
  const notifications = trpc.completionTasks.notifications.useQuery(undefined, { enabled: isAdmin });
  const invalidate = () => Promise.all([utils.completionTasks.mine.invalidate(), utils.completionTasks.all.invalidate(), utils.completionTasks.notifications.invalidate()]);
  const accept = trpc.completionTasks.accept.useMutation({ onSuccess: async () => { await invalidate(); toast.success("Task accepted."); }, onError: problem => toast.error(problem.message) });
  const complete = trpc.completionTasks.complete.useMutation({ onSuccess: async () => { await invalidate(); toast.success("Task marked complete."); }, onError: problem => toast.error(problem.message) });
  const markRead = trpc.completionTasks.markNotificationsRead.useMutation({ onSuccess: () => void utils.completionTasks.notifications.invalidate(), onError: problem => toast.error(problem.message) });
  const tasks = isAdmin ? allTasks.data : myTasks.data;
  const isLoading = isAdmin ? allTasks.isLoading : myTasks.isLoading;
  const unread = notifications.data?.filter(notification => !notification.readAt).length ?? 0;

  return <div className="mx-auto max-w-6xl space-y-6 fade-rise">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500">Protected operational workflow</p><h1 className="mt-1 font-display text-3xl text-[#172b38]">Completion tasks</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Tasks identify the internal record that needs work. Administrative notifications deliberately omit research IDs, diagnoses, and patient information.</p></div><div className="flex items-center gap-2 rounded-xl border border-[#dce9e5] bg-[#f3faf8] px-3 py-2 text-xs font-medium text-[#286069]"><ShieldCheck className="h-4 w-4" />Pseudonymised workflow</div></div>
    <div className={`grid gap-6 ${isAdmin ? "xl:grid-cols-[1.5fr_0.85fr]" : ""}`}>
      <Card className="border-[#e1e9e5] shadow-sm"><CardHeader className="border-b border-[#edf1ef]"><CardTitle className="flex items-center gap-2 text-[#24434b]"><ClipboardCheck className="h-5 w-5 text-[#246c6e]" />{isAdmin ? "All completion tasks" : "My assigned tasks"}</CardTitle><CardDescription>{isAdmin ? "Current tasks across approved research members." : "Accept an assigned task before marking it complete."}</CardDescription></CardHeader><CardContent className="p-0">{isLoading ? <div className="space-y-3 p-5">{[1, 2, 3].map(row => <Skeleton key={row} className="h-20 w-full" />)}</div> : !tasks?.length ? <div className="px-6 py-16 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-[#2f746b]" /><h2 className="mt-4 font-display text-xl text-[#243b44]">No completion tasks</h2><p className="mt-2 text-sm text-slate-500">{isAdmin ? "Use the assignment control in Patient Registry to create a protected task." : "Newly assigned tasks will appear here."}</p></div> : <div className="divide-y divide-[#edf1ef]">{tasks.map(task => <div key={task.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[#245961]">Protected research record</p><TaskStatus status={task.status} /></div><p className="mt-1 text-sm text-[#4b6469]">{cohortLabels[task.cohort] ?? "Registry cohort"}</p><p className="mt-1 text-xs text-slate-500">Updated {new Date(task.updatedAt).toLocaleString()}</p>{isAdmin && "assigneeName" in task && <p className="mt-1 text-xs text-slate-500">Assigned to: {(task as { assigneeName?: string | null }).assigneeName?.trim() || "OAuth display name unavailable"}</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => navigate(`/records/${task.patientRecordId}`)}>Review record</Button>{task.assignedToUserId === user?.id && ["assigned", "reassigned"].includes(task.status) && <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate({ taskId: task.id })} className="bg-[#125d69] hover:bg-[#0d4b55]">Accept task</Button>}{task.assignedToUserId === user?.id && task.status === "accepted" && <Button size="sm" disabled={complete.isPending} onClick={() => complete.mutate({ taskId: task.id })} className="bg-emerald-700 hover:bg-emerald-800">Mark complete</Button>}</div></div>)}</div>}</CardContent></Card>
      {isAdmin && <Card className="h-fit border-[#e1e9e5] shadow-sm"><CardHeader className="border-b border-[#edf1ef]"><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-[#24434b]"><Bell className="h-5 w-5 text-[#246c6e]" />Administrator notifications {unread ? <Badge className="bg-[#125d69]">{unread}</Badge> : null}</CardTitle><CardDescription className="mt-1">Operational status only; no record or clinical details.</CardDescription></div>{unread ? <Button variant="outline" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate()}>Mark read</Button> : null}</div></CardHeader><CardContent className="p-0">{notifications.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : !notifications.data?.length ? <div className="px-5 py-10 text-center text-sm text-slate-500">No task notifications yet.</div> : <div className="divide-y divide-[#edf1ef]">{notifications.data.map(notification => <div key={notification.id} className={`p-4 ${notification.readAt ? "bg-white" : "bg-[#f5fbf9]"}`}><p className="text-sm font-medium text-[#31484d]">{getTaskNotificationLabel(notification.eventType)}</p><p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p></div>)}</div>}</CardContent></Card>}
    </div>
  </div>;
}
