import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, Download, FileSpreadsheet, KeyRound, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";

export const ADMINISTRATOR_DISPLAY_NAME = "Abdelrahman Ibrahim Rashad";

export function getApplicantDisplayName(name: string | null | undefined) {
  return name?.trim() || ADMINISTRATOR_DISPLAY_NAME;
}

function AccessBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    approved: "border-emerald-100 bg-emerald-50 text-emerald-700",
    pending: "border-amber-100 bg-amber-50 text-amber-700",
    suspended: "border-rose-100 bg-rose-50 text-rose-700",
  };
  return <Badge variant="outline" className={`${colors[value]} capitalize`}>{value}</Badge>;
}

function downloadCsv(rows: object[]) {
  const records = rows as Record<string, unknown>[];
  const headers = Array.from(new Set(records.flatMap(row => Object.keys(row))));
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers.join(","), ...records.map(row => headers.map(header => escape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mansoura-university-neurology-registry-deidentified-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AccessManagement() {
  const utils = trpc.useUtils();
  const { data: users, isLoading, error } = trpc.administration.users.useQuery();
  const setAccess = trpc.administration.setAccess.useMutation({
    onSuccess: () => {
      utils.administration.users.invalidate();
      toast.success("User access updated");
    },
    onError: problem => toast.error(problem.message),
  });
  const exportMutation = trpc.administration.exportDeidentified.useMutation({
    onSuccess: rows => {
      downloadCsv(rows);
      toast.success(`De-identified CSV generated for ${rows.length} records`);
    },
    onError: problem => toast.error(problem.message),
  });

  return <div className="mx-auto max-w-7xl space-y-6 fade-rise">
    <div>
      <p className="text-sm text-slate-500">Mansoura University Neurology Research Registry.</p>
      <h1 className="mt-1 font-display text-3xl text-[#172b38]">Access Management</h1>
    </div>

    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="border-[#cfe3de] bg-[#eff8f5] shadow-sm">
        <CardContent className="p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d9f0e9] text-[#287168]"><FileSpreadsheet className="h-5 w-5" /></span>
          <p className="mt-5 text-xs font-bold tracking-[0.13em] text-[#3d7a72]">MANSOURA UNIVERSITY EXPORT</p>
          <h2 className="mt-2 font-display text-2xl text-[#1f4148]">De-identified CSV only</h2>
          <p className="mt-3 text-sm leading-6 text-[#4f6d6d]">The export uses MUNR Research ID and age bands, and excludes user IDs, timestamps, audit metadata, file metadata, and direct identifiers.</p>
          <Button className="mt-6 w-full bg-[#125d69] hover:bg-[#0d4b55]" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate()}>
            <Download className="mr-2 h-4 w-4" />{exportMutation.isPending ? "Preparing export…" : "Download de-identified CSV"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#e1e9e5] shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-[#e8efec] p-6">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f4] text-[#2d716a]"><UsersRound className="h-4 w-4" /></span>
            <div>
              <h2 className="font-display text-xl text-[#203943]">Authorised research users</h2>
              <p className="text-xs text-slate-500">Pending access is manually approved by Abdelrahman Ibrahim Rashad.</p>
            </div>
          </div>
          {error ? <div className="p-6 text-sm text-rose-700">Users could not be loaded. {error.message}</div> : isLoading ? <div className="space-y-3 p-6"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></div> : <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f7faf8] text-xs font-semibold uppercase tracking-[0.08em] text-[#68807e]"><tr><th className="px-6 py-3">Applicant</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Access</th><th className="px-6 py-3 text-right">Manual decision</th></tr></thead>
              <tbody>{users?.map(user => <tr key={user.id} className="border-t border-[#edf1ef]">
                <td className="px-6 py-4"><p className="font-medium text-[#30434c]">{getApplicantDisplayName(user.name)}</p><p className="mt-0.5 text-xs text-slate-500">{user.email || "No institutional email available"}</p></td>
                <td className="px-4 py-4"><Badge variant="outline" className="capitalize">{user.role}</Badge></td>
                <td className="px-4 py-4"><AccessBadge value={user.accessStatus} /></td>
                <td className="px-6 py-4 text-right">{user.accessStatus === "approved" ? <Button size="sm" variant="outline" disabled={setAccess.isPending} onClick={() => setAccess.mutate({ userId: user.id, accessStatus: "suspended" })}>Suspend</Button> : <Button size="sm" disabled={setAccess.isPending} className="bg-[#125d69] hover:bg-[#0d4b55]" onClick={() => setAccess.mutate({ userId: user.id, accessStatus: "approved" })}><Check className="mr-1.5 h-3.5 w-3.5" />Approve</Button>}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        </CardContent>
      </Card>
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-[#dce9e5] shadow-sm"><CardContent className="p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f4] text-[#2d716a]"><KeyRound className="h-4 w-4" /></span><p className="mt-4 text-xs font-bold tracking-[0.12em] text-[#3d7a72]">1. SECURE SIGN-IN</p><p className="mt-2 text-sm leading-6 text-slate-600">Accounts use the existing OAuth identity flow. The registry does not create, display, or store local passwords.</p></CardContent></Card>
      <Card className="border-[#dce9e5] shadow-sm"><CardContent className="p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f4] text-[#2d716a]"><UsersRound className="h-4 w-4" /></span><p className="mt-4 text-xs font-bold tracking-[0.12em] text-[#3d7a72]">2. APPLICANT DETAILS</p><p className="mt-2 text-sm leading-6 text-slate-600">The approver reviews the authenticated display name, institutional email when available, requested role, and protocol authorisation.</p></CardContent></Card>
      <Card className="border-[#dce9e5] shadow-sm"><CardContent className="p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f4] text-[#2d716a]"><ShieldCheck className="h-4 w-4" /></span><p className="mt-4 text-xs font-bold tracking-[0.12em] text-[#3d7a72]">3. MANUAL DECISION</p><p className="mt-2 text-sm leading-6 text-slate-600">Abdelrahman Ibrahim Rashad approves or suspends access. Approval does not grant permission to export direct identifiers or clear protected registry data.</p></CardContent></Card>
      <Card className="border-[#efd9d4] bg-[#fffaf9] shadow-sm"><CardContent className="p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0ee] text-[#9b3b33]"><ShieldAlert className="h-4 w-4" /></span><p className="mt-4 text-xs font-bold tracking-[0.12em] text-[#9b4b42]">4. OWNER-ONLY CLEARING</p><p className="mt-2 text-sm leading-6 text-[#705651]">No protected record-clear or deletion control is enabled today. If one is approved later, it must be bound server-side to Abdelrahman’s registered OAuth identity and administrator role—not to a display name or local password.</p></CardContent></Card>
    </section>

    <div className="flex gap-3 rounded-xl border border-[#f0d8bb] bg-[#fff8ef] p-4 text-sm leading-6 text-[#805824]">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p><strong>Privacy and governance reminder:</strong> Do not collect passwords, national ID numbers, patient identifiers, or contact details in approval notes. After Abdelrahman Ibrahim Rashad completes secure sign-in, an existing administrator must approve the account and assign its administrator role using the authenticated OAuth identity. Public preview Saved Items are separate browser-local preferences and never clear protected registry data.</p>
    </div>
  </div>;
}
