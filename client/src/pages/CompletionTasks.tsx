import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowDownAZ, Bell, ChevronLeft, ChevronRight, ClipboardCheck, ListFilter, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const cohortLabels: Record<string, string> = {
  stroke: "Stroke", multiple_sclerosis: "Multiple Sclerosis (MS)", abnormal_movements: "Abnormal Movements", guillain_barre: "Guillain–Barré Syndrome (GBS)", myasthenia_gravis: "Myasthenia Gravis (MG)", myelopathy: "Myelopathy", neuro_ophthalmology: "Neuro-ophthalmology", cidp: "CIDP",
};

export const COMPLETION_TASKS_PAGE_SIZE = 10;
export const taskStatusFilterOptions = [
  { value: "all", label: "All statuses" },
  { value: "action_required", label: "Awaiting acceptance" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
] as const;
export const taskSortOptions = [
  { value: "attention_first", label: "Attention required first" },
  { value: "updated_desc", label: "Recently updated" },
  { value: "updated_asc", label: "Oldest updated" },
  { value: "status", label: "Status" },
] as const;
export type TaskStatusFilter = typeof taskStatusFilterOptions[number]["value"];
export type TaskSortOption = typeof taskSortOptions[number]["value"];
type FilterableCompletionTask = { id: number; status: string; updatedAt: Date | string };

const taskStatusRank: Record<string, number> = { assigned: 0, reassigned: 0, accepted: 1, completed: 2 };
const toTime = (date: Date | string) => new Date(date).getTime();

export function filterAndSortCompletionTasks<T extends FilterableCompletionTask>(tasks: T[], statusFilter: TaskStatusFilter, sortOption: TaskSortOption) {
  const filtered = tasks.filter(task => statusFilter === "all" || (statusFilter === "action_required" ? ["assigned", "reassigned"].includes(task.status) : task.status === statusFilter));
  return [...filtered].sort((left, right) => {
    if (sortOption === "updated_asc") return toTime(left.updatedAt) - toTime(right.updatedAt) || left.id - right.id;
    if (sortOption === "updated_desc") return toTime(right.updatedAt) - toTime(left.updatedAt) || left.id - right.id;
    const statusDifference = taskStatusRank[left.status] - taskStatusRank[right.status];
    if (sortOption === "status") return statusDifference || toTime(right.updatedAt) - toTime(left.updatedAt) || left.id - right.id;
    return statusDifference || toTime(right.updatedAt) - toTime(left.updatedAt) || left.id - right.id;
  });
}

export function getCompletionTaskPage<T>(tasks: T[], requestedPage: number, pageSize = COMPLETION_TASKS_PAGE_SIZE) {
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.ceil(tasks.length / safePageSize);
  const page = pageCount === 0 ? 1 : Math.min(Math.max(1, requestedPage), pageCount);
  const start = (page - 1) * safePageSize;
  return { items: tasks.slice(start, start + safePageSize), page, pageCount, totalItems: tasks.length, firstItem: tasks.length ? start + 1 : 0, lastItem: Math.min(start + safePageSize, tasks.length) };
}

export function getCompletionTaskPagination(totalItems: number, requestedPage: number, pageSize = COMPLETION_TASKS_PAGE_SIZE) {
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.ceil(totalItems / safePageSize);
  const page = pageCount === 0 ? 1 : Math.min(Math.max(1, requestedPage), pageCount);
  const start = (page - 1) * safePageSize;
  return { page, pageCount, totalItems, firstItem: totalItems ? start + 1 : 0, lastItem: Math.min(start + safePageSize, totalItems) };
}

export function getTaskStatusLabel(status: string) { return status === "reassigned" ? "Reassigned — accept again" : status.charAt(0).toUpperCase() + status.slice(1); }
export function getTaskNotificationLabel(eventType: string) {
  return ({ assigned: "A record-completion task was assigned.", accepted: "A record-completion task was accepted.", completed: "A record-completion task was marked complete.", reassigned: "A record-completion task was reassigned.", record_completion_changed: "A record-completion status changed." } as Record<string, string>)[eventType] ?? "A protected task event occurred.";
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
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [sortOption, setSortOption] = useState<TaskSortOption>("attention_first");
  const [currentPage, setCurrentPage] = useState(1);
  const taskQuery = useMemo(() => ({ status: statusFilter === "all" ? undefined : statusFilter, sort: sortOption, page: currentPage, pageSize: COMPLETION_TASKS_PAGE_SIZE }), [statusFilter, sortOption, currentPage]);
  const myTasks = trpc.completionTasks.mine.useQuery(taskQuery, { enabled: !isAdmin });
  const allTasks = trpc.completionTasks.all.useQuery(taskQuery, { enabled: isAdmin });
  const notifications = trpc.completionTasks.notifications.useQuery(undefined, { enabled: isAdmin });
  const invalidate = () => Promise.all([utils.completionTasks.mine.invalidate(), utils.completionTasks.all.invalidate(), utils.completionTasks.notifications.invalidate()]);
  const accept = trpc.completionTasks.accept.useMutation({ onSuccess: async () => { await invalidate(); toast.success("Task accepted."); }, onError: problem => toast.error(problem.message) });
  const complete = trpc.completionTasks.complete.useMutation({ onSuccess: async () => { await invalidate(); toast.success("Task marked complete."); }, onError: problem => toast.error(problem.message) });
  const markRead = trpc.completionTasks.markNotificationsRead.useMutation({ onSuccess: () => void utils.completionTasks.notifications.invalidate(), onError: problem => toast.error(problem.message) });
  const taskResult = isAdmin ? allTasks.data : myTasks.data;
  const taskPage = useMemo(() => getCompletionTaskPagination(taskResult?.totalItems ?? 0, taskResult?.page ?? currentPage, taskResult?.pageSize ?? COMPLETION_TASKS_PAGE_SIZE), [taskResult?.totalItems, taskResult?.page, taskResult?.pageSize, currentPage]);
  const isLoading = isAdmin ? allTasks.isLoading : myTasks.isLoading;
  const unread = notifications.data?.filter(notification => !notification.readAt).length ?? 0;
  const visibleCountLabel = `${taskPage.totalItems} ${taskPage.totalItems === 1 ? "task" : "tasks"} matching`;

  useEffect(() => {
    if (taskResult?.page && taskResult.page !== currentPage) setCurrentPage(taskResult.page);
  }, [taskResult?.page, currentPage]);

  const changeStatusFilter = (value: string) => { setStatusFilter(value as TaskStatusFilter); setCurrentPage(1); };
  const changeSortOption = (value: string) => { setSortOption(value as TaskSortOption); setCurrentPage(1); };

  return <div className="mx-auto max-w-6xl space-y-6 fade-rise">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500">Protected operational workflow</p><h1 className="mt-1 font-display text-3xl text-[#172b38]">Completion tasks</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Tasks identify the internal record that needs work. Administrative notifications deliberately omit research IDs, diagnoses, and patient information.</p></div><div className="flex items-center gap-2 rounded-xl border border-[#dce9e5] bg-[#f3faf8] px-3 py-2 text-xs font-medium text-[#286069]"><ShieldCheck className="h-4 w-4" />Pseudonymised workflow</div></div>
    <div className={`grid gap-6 ${isAdmin ? "xl:grid-cols-[1.5fr_0.85fr]" : ""}`}>
      <Card className="border-[#e1e9e5] shadow-sm"><CardHeader className="border-b border-[#edf1ef]"><CardTitle className="flex items-center gap-2 text-[#24434b]"><ClipboardCheck className="h-5 w-5 text-[#246c6e]" />{isAdmin ? "All completion tasks" : "My assigned tasks"}</CardTitle><CardDescription>{isAdmin ? "Current tasks across approved research members." : "Accept an assigned task before marking it complete."}</CardDescription></CardHeader><CardContent className="p-0"><div className="grid gap-3 border-b border-[#edf1ef] bg-[#fbfdfc] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><div><label htmlFor="task-status-filter" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#45616a]"><ListFilter className="h-3.5 w-3.5" />Task status</label><Select value={statusFilter} onValueChange={changeStatusFilter}><SelectTrigger id="task-status-filter" aria-label="Filter completion tasks by status"><SelectValue /></SelectTrigger><SelectContent>{taskStatusFilterOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div><label htmlFor="task-sort" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#45616a]"><ArrowDownAZ className="h-3.5 w-3.5" />Sort tasks</label><Select value={sortOption} onValueChange={changeSortOption}><SelectTrigger id="task-sort" aria-label="Sort completion tasks"><SelectValue /></SelectTrigger><SelectContent>{taskSortOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><p className="self-end pb-2 text-right text-xs font-medium text-slate-500" aria-live="polite">{visibleCountLabel}</p></div>{isLoading ? <div className="space-y-3 p-5">{[1, 2, 3].map(row => <Skeleton key={row} className="h-20 w-full" />)}</div> : taskPage.totalItems === 0 && statusFilter === "all" ? <EmptyTasks isAdmin={isAdmin} /> : taskPage.totalItems === 0 ? <div className="px-6 py-14 text-center"><ListFilter className="mx-auto h-7 w-7 text-[#2f746b]" /><h2 className="mt-4 font-display text-xl text-[#243b44]">No matching tasks</h2><p className="mt-2 text-sm text-slate-500">Adjust the status filter to view other completion tasks.</p><Button className="mt-4" variant="outline" onClick={() => changeStatusFilter("all")}>Show all statuses</Button></div> : <><div className="divide-y divide-[#edf1ef]">{taskResult?.items.map(task => <div key={task.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[#245961]">Protected research record</p><TaskStatus status={task.status} /></div><p className="mt-1 text-sm text-[#4b6469]">{cohortLabels[task.cohort] ?? "Registry cohort"}</p><p className="mt-1 text-xs text-slate-500">Updated {new Date(task.updatedAt).toLocaleString()}</p>{isAdmin && "assigneeName" in task && <p className="mt-1 text-xs text-slate-500">Assigned to: {(task as { assigneeName?: string | null }).assigneeName?.trim() || "OAuth display name unavailable"}</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => navigate(`/records/${task.patientRecordId}`)}>Review record</Button>{task.assignedToUserId === user?.id && ["assigned", "reassigned"].includes(task.status) && <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate({ taskId: task.id })} className="bg-[#125d69] hover:bg-[#0d4b55]">Accept task</Button>}{task.assignedToUserId === user?.id && task.status === "accepted" && <Button size="sm" disabled={complete.isPending} onClick={() => complete.mutate({ taskId: task.id })} className="bg-emerald-700 hover:bg-emerald-800">Mark complete</Button>}</div></div>)}</div><TaskPagination page={taskPage.page} pageCount={taskPage.pageCount} firstItem={taskPage.firstItem} lastItem={taskPage.lastItem} totalItems={taskPage.totalItems} onPageChange={setCurrentPage} /></>}</CardContent></Card>
      {isAdmin && <Card className="h-fit border-[#e1e9e5] shadow-sm"><CardHeader className="border-b border-[#edf1ef]"><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-[#24434b]"><Bell className="h-5 w-5 text-[#246c6e]" />Administrator notifications {unread ? <Badge className="bg-[#125d69]">{unread}</Badge> : null}</CardTitle><CardDescription className="mt-1">Operational status only; no record or clinical details.</CardDescription></div>{unread ? <Button variant="outline" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate()}>Mark read</Button> : null}</div></CardHeader><CardContent className="p-0">{notifications.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : !notifications.data?.length ? <div className="px-5 py-10 text-center text-sm text-slate-500">No task notifications yet.</div> : <div className="divide-y divide-[#edf1ef]">{notifications.data.map(notification => <div key={notification.id} className={`p-4 ${notification.readAt ? "bg-white" : "bg-[#f5fbf9]"}`}><p className="text-sm font-medium text-[#31484d]">{getTaskNotificationLabel(notification.eventType)}</p><p className="mt-1 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p></div>)}</div>}</CardContent></Card>}
    </div>
  </div>;
}

function TaskPagination({ page, pageCount, firstItem, lastItem, totalItems, onPageChange }: { page: number; pageCount: number; firstItem: number; lastItem: number; totalItems: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) return null;
  return <nav className="flex flex-col gap-3 border-t border-[#edf1ef] bg-[#fbfdfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Task pagination"><p className="text-xs text-slate-500" aria-live="polite">Showing {firstItem}–{lastItem} of {totalItems} matching tasks</p><div className="flex items-center justify-between gap-2 sm:justify-end"><Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous task page"><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><span className="min-w-20 text-center text-xs font-medium text-[#45616a]">Page {page} of {pageCount}</span><Button type="button" variant="outline" size="sm" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next task page">Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div></nav>;
}

function EmptyTasks({ isAdmin }: { isAdmin: boolean }) {
  return <div className="px-6 py-16 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-[#2f746b]" /><h2 className="mt-4 font-display text-xl text-[#243b44]">No completion tasks</h2><p className="mt-2 text-sm text-slate-500">{isAdmin ? "Use the assignment control in Patient Registry to create a protected task." : "Newly assigned tasks will appear here."}</p></div>;
}
