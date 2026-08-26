import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CircleAlert, LockKeyhole, MessageSquare, RefreshCcw, Send, ShieldAlert, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function initials(value?: string | null) {
  return (value || "User").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function Messages() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: recipients = [], isLoading: recipientsLoading, isError: recipientsError, error: recipientsProblem, refetch: refetchRecipients } = trpc.messages.recipients.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const selectedRecipient = useMemo(() => recipients.find(recipient => recipient.id === selectedUserId) ?? null, [recipients, selectedUserId]);
  const { data: thread = [], isLoading: threadLoading, isError: threadError, error: threadProblem, refetch: refetchThread } = trpc.messages.thread.useQuery({ recipientUserId: selectedUserId ?? 0 }, { enabled: Boolean(selectedUserId), refetchInterval: 8000 });
  const send = trpc.messages.send.useMutation({
    onSuccess: () => {
      setDraft("");
      if (selectedUserId) utils.messages.thread.invalidate({ recipientUserId: selectedUserId });
      utils.messages.recipients.invalidate();
    },
    onError: problem => toast.error(problem.message),
  });

  useEffect(() => {
    if (selectedUserId && !recipients.some(recipient => recipient.id === selectedUserId)) {
      setSelectedUserId(null);
      setDraft("");
      return;
    }
    if (!selectedUserId && recipients[0]) setSelectedUserId(recipients[0].id);
  }, [recipients, selectedUserId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUserId || !draft.trim()) return;
    send.mutate({ recipientUserId: selectedUserId, body: draft.trim() });
  };

  return <div className="mx-auto max-w-7xl space-y-6 fade-rise">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm text-slate-500">Approved-user workspace · no clinical-record context is attached to messages.</p><h1 className="mt-1 font-display text-3xl text-[#172b38]">Messages</h1></div>
      <div className="flex items-center gap-2 rounded-full border border-[#dce9e6] bg-[#f3faf8] px-3 py-1.5 text-xs font-medium text-[#286069]"><LockKeyhole className="h-3.5 w-3.5" />Approved users only</div>
    </div>

    <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-[#dce9e5] bg-white shadow-sm lg:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="border-b border-[#e7efec] bg-[#f8fbfa] lg:border-b-0 lg:border-r">
        <div className="border-b border-[#e7efec] p-5"><div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#287168]" /><p className="text-xs font-bold tracking-[0.12em] text-[#397a72]">APPROVED COLLEAGUES</p></div><p className="mt-2 text-sm leading-6 text-slate-500">Choose an approved registry user for a direct, work-only conversation.</p></div>
        <ScrollArea className="h-[280px] lg:h-[520px]"><div className="space-y-3 p-3">{recipientsLoading ? <div aria-live="polite" className="space-y-3"><p className="px-1 text-xs font-medium text-slate-500">Checking approved colleagues…</p><div className="h-16 animate-pulse rounded-xl bg-slate-100" /><div className="h-16 animate-pulse rounded-xl bg-slate-100" /></div> : recipientsError ? <div className="rounded-xl border border-[#f0d8bb] bg-[#fff8ef] p-4 text-sm leading-6 text-[#805824]"><div className="flex gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>Approved colleagues could not be loaded. No message can be started until this check succeeds.</p></div><Button type="button" variant="outline" size="sm" onClick={() => refetchRecipients()} className="mt-3 border-[#dfc79e] text-[#805824] hover:bg-[#fff3df]"><RefreshCcw className="mr-2 h-3.5 w-3.5" />Try again</Button><p className="sr-only">{recipientsProblem?.message}</p></div> : recipients.length === 0 ? <div className="rounded-xl border border-dashed border-[#dce9e5] p-4 text-sm leading-6 text-slate-500">No other approved users are available yet.</div> : recipients.map(recipient => <button key={recipient.id} onClick={() => setSelectedUserId(recipient.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${recipient.id === selectedUserId ? "bg-[#dff2ed] text-[#1b615d]" : "hover:bg-white"}`}><Avatar className="h-9 w-9"><AvatarFallback className="bg-[#d7eee8] text-xs text-[#276b65]">{initials(recipient.name)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-semibold">{recipient.name || "Approved registry user"}</p><p className="truncate text-xs text-slate-500">{recipient.email || recipient.role}</p></div></button>)}</div></ScrollArea>
      </aside>

      <section className="flex min-h-[620px] flex-col">
        <div className="flex items-center justify-between border-b border-[#e7efec] px-5 py-4"><div className="flex items-center gap-3">{selectedRecipient ? <><Avatar className="h-10 w-10"><AvatarFallback className="bg-[#d7eee8] text-xs text-[#276b65]">{initials(selectedRecipient.name)}</AvatarFallback></Avatar><div><p className="font-semibold text-[#24424a]">{selectedRecipient.name || "Approved registry user"}</p><p className="text-xs text-slate-500">Direct approved-user conversation</p></div></> : <><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf7f4] text-[#2d716a]"><MessageSquare className="h-5 w-5" /></span><p className="font-medium text-slate-600">Select an approved colleague</p></>}</div></div>
        <ScrollArea className="flex-1 bg-[#fcfdfd]"><div className="space-y-4 p-5">{!selectedUserId ? <EmptyThread /> : threadLoading ? <div className="space-y-3"><div className="h-14 w-2/3 animate-pulse rounded-2xl bg-slate-100" /><div className="ml-auto h-14 w-1/2 animate-pulse rounded-2xl bg-[#eaf6f2]" /></div> : threadError ? <ThreadLoadError detail={threadProblem?.message} onRetry={() => refetchThread()} /> : thread.length === 0 ? <EmptyThread /> : thread.map(message => { const mine = message.senderUserId === user?.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${mine ? "bg-[#176b6b] text-white" : "border border-[#deebe7] bg-white text-[#30484e]"}`}><p className={`mb-1 text-[10px] font-bold tracking-[0.1em] ${mine ? "text-[#c6efdf]" : "text-[#5c837d]"}`}>{mine ? "YOU" : message.senderName || "APPROVED USER"}</p><p className="whitespace-pre-wrap break-words">{message.body}</p><p className={`mt-1 text-[10px] ${mine ? "text-[#c6efdf]" : "text-slate-400"}`}>{new Date(message.createdAt).toLocaleString()}</p></div></div>; })}</div></ScrollArea>
        <div className="border-t border-[#e7efec] bg-white p-4"><div className="mb-3 flex gap-2 rounded-xl border border-[#f0d8bb] bg-[#fff8ef] p-3 text-xs leading-5 text-[#805824]"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>Do not include patient names, phone numbers, national IDs, MUNR Research IDs, report text, or clinical record details in messages.</p></div><form onSubmit={submit} className="flex items-end gap-3"><Textarea value={draft} onChange={event => setDraft(event.target.value)} disabled={!selectedUserId || send.isPending} placeholder={selectedUserId ? "Write a work-only message…" : "Choose an approved colleague first"} className="min-h-[78px] resize-none" maxLength={1000} /><Button type="submit" disabled={!selectedUserId || !draft.trim() || send.isPending} className="h-11 bg-[#125d69] hover:bg-[#0d4b55]"><Send className="mr-2 h-4 w-4" />Send</Button></form></div>
      </section>
    </div>
  </div>;
}

function EmptyThread() {
  return <Card className="mx-auto mt-14 max-w-md border-dashed border-[#d9e8e4] bg-white shadow-none"><CardContent className="p-7 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#edf7f4] text-[#2d716a]"><MessageSquare className="h-5 w-5" /></span><h2 className="mt-4 font-display text-xl text-[#24424a]">No messages yet</h2><p className="mt-2 text-sm leading-6 text-slate-500">Start a direct work-only conversation with an approved registry user. Patient research data must remain in the secure record workflow, not in messages.</p></CardContent></Card>;
}

function ThreadLoadError({ detail, onRetry }: { detail?: string; onRetry: () => void }) {
  return <Card className="mx-auto mt-14 max-w-md border-[#f0d8bb] bg-[#fff8ef] shadow-none"><CardContent className="p-7 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0dc] text-[#97652b]"><CircleAlert className="h-5 w-5" /></span><h2 className="mt-4 font-display text-xl text-[#805824]">Conversation unavailable</h2><p className="mt-2 text-sm leading-6 text-[#805824]">The direct conversation could not be loaded. The recipient may no longer have approved access.</p><Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-5 border-[#dfc79e] text-[#805824] hover:bg-[#fff3df]"><RefreshCcw className="mr-2 h-3.5 w-3.5" />Try again</Button><p className="sr-only">{detail}</p></CardContent></Card>;
}
