import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, BrainCircuit, Camera, ClipboardCheck, ClipboardList, Eye, HeartPulse, LayoutDashboard, Loader2, LogOut, MessageSquare, Microscope, PanelLeft, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: ClipboardList, label: "Patient Registry", path: "/registry" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Plus, label: "New Record", path: "/records/new" },
];
const SIDEBAR_WIDTH_KEY = "egr-sidebar-width";
const DEFAULT_WIDTH = 276;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const PROFILE_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function ProfileAvatar({ name, logout }: { name: string | null | undefined; logout: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: avatar } = trpc.profile.avatar.useQuery();
  const replaceAvatar = trpc.profile.replaceAvatar.useMutation({
    onSuccess: () => {
      void utils.profile.avatar.invalidate();
      toast.success("Profile picture updated");
    },
    onError: problem => toast.error(problem.message),
  });

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (!PROFILE_AVATAR_MIME_TYPES.includes(file.type as typeof PROFILE_AVATAR_MIME_TYPES[number])) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      toast.error("Profile pictures must be 2 MB or smaller.");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    replaceAvatar.mutate({ mimeType: file.type as typeof PROFILE_AVATAR_MIME_TYPES[number], sizeBytes: file.size, contentBase64: btoa(binary) });
  };

  return <>
    <Avatar className="h-9 w-9 shrink-0 border border-white/15"><AvatarImage src={avatar?.url} alt="Your profile picture" /><AvatarFallback className="bg-[#1c4650] text-xs text-white">{name?.slice(0, 1).toUpperCase() ?? "U"}</AvatarFallback></Avatar>
    <Input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a profile picture" disabled={replaceAvatar.isPending} onChange={event => { void uploadAvatar(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    <DropdownMenuContent align="end">
      <DropdownMenuItem className="cursor-pointer" disabled={replaceAvatar.isPending} onSelect={event => { event.preventDefault(); inputRef.current?.click(); }}><Camera className="mr-2 h-4 w-4" />{replaceAvatar.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Uploading picture…</> : "Update profile picture"}</DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user, logout } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <SignInGate />;
  if (user.accessStatus !== "approved") return <AccessPending status={user.accessStatus} logout={logout} />;

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function SignInGate() {
  return (
    <div className="clinical-grid min-h-screen bg-[#edf3f1] p-5 flex items-center justify-center">
      <div className="fade-rise w-full max-w-5xl overflow-hidden rounded-[1.7rem] border border-[#dce8e4] bg-white shadow-[0_28px_80px_rgba(17,43,56,0.14)]">
        <div className="bg-[#0b1d2a] px-8 py-9 text-white"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#94d9ca] text-[#0b1d2a]"><Activity className="h-5 w-5" /></span><span className="font-display text-xl">Mansoura University</span></div><p className="mt-5 text-sm leading-6 text-slate-300">Neurology Research Registry · protected pseudonymised research records.</p></div>
        <div className="grid gap-8 p-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-[10px] font-bold tracking-[0.15em] text-[#33766e]">SECURE ACCESS</p><h1 className="mt-2 font-display text-3xl text-[#172b38]">Authorised access only</h1><p className="mt-3 text-sm leading-6 text-slate-500">Sign in to request or use approved access. Patient records are available only to authorised research personnel.</p><Button onClick={() => startLogin()} className="mt-7 w-full bg-[#125d69] hover:bg-[#0d4b55]">Sign in securely</Button><a href="/workflow-preview" className="mt-3 block text-center text-sm font-medium text-[#21646a] underline-offset-4 hover:underline">View the public workflow demonstration</a></div><div className="rounded-2xl border border-[#dce9e5] bg-[#f5faf8] p-5"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-[#2f746b]" /><p className="text-[11px] font-bold tracking-[0.14em] text-[#397a72]">LATEST CLINICAL WORKFLOW ADDED</p></div><h2 className="mt-2 font-display text-xl text-[#1c3d47]">New structured fields are ready after sign-in.</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><ReleaseSummary icon={HeartPulse} title="Stroke" detail="Complications, NIHSS / mRS evaluation, and discharge treatment." /><ReleaseSummary icon={BrainCircuit} title="Multiple Sclerosis" detail="TB screening, MSFC, infection-exclusion review, and dated DMT adherence." /><ReleaseSummary icon={Microscope} title="CIDP & neuropathy" detail="Typical CIDP, MADSAM, mononeuritis multiplex, vasculitic pathway, and immune-therapy safety." /><ReleaseSummary icon={Eye} title="Neuro-ophthalmology" detail="NMOSD, MOGAD, GCA, AQP4/MOG profile, and linked systemic disease." /></div><p className="mt-4 text-xs leading-5 text-[#587579]">This release summary contains no patient information. Registry data remains hidden until access is approved.</p></div></div>
      </div>
    </div>
  );
}

function ReleaseSummary({ icon: Icon, title, detail }: { icon: typeof Activity; title: string; detail: string }) { return <div className="rounded-xl border border-[#dce9e5] bg-white p-3"><Icon className="h-4 w-4 text-[#2d746b]" /><p className="mt-2 text-sm font-semibold text-[#25424a]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>; }

function AccessPending({ status, logout }: { status: "pending" | "suspended"; logout: () => void }) {
  const suspended = status === "suspended";
  return (
    <div className="clinical-grid min-h-screen bg-[#edf3f1] p-5 flex items-center justify-center"><div className="fade-rise max-w-lg rounded-[1.7rem] border border-[#dce8e4] bg-white p-9 shadow-[0_28px_80px_rgba(17,43,56,0.14)]"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${suspended ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}><ShieldCheck className="h-6 w-6" /></div><h1 className="mt-6 font-display text-3xl text-[#172b38]">{suspended ? "Access is suspended" : "Access approval required"}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{suspended ? "This account is not currently permitted to enter the registry. Please contact a registry administrator." : "Your account has been created but has not yet been approved. Abdelrahman Ibrahim Rashad reviews access requests manually; no patient records are visible until approval is granted."}</p><Button variant="outline" onClick={logout} className="mt-7">Sign out</Button></div></div>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const menuItems = user?.role === "admin" ? [...baseMenuItems, { icon: UsersRound, label: "Access Management", path: "/access" }] : baseMenuItems;
  const activeItem = menuItems.find(item => location === item.path);

  useEffect(() => {
    const move = (event: MouseEvent) => { if (!isResizing || isCollapsed) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = event.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); };
    const up = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, isCollapsed, setSidebarWidth]);

  return (
      <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-[#1a3544] bg-[#0b1d2a] text-slate-100" disableTransition={isResizing}><SidebarHeader className="h-[78px] px-3 justify-center"><div className="flex items-center gap-3"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#b7d6d2] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94d9ca]" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><p className="font-display text-[17px] leading-none text-white">Mansoura University</p><p className="mt-1 text-[10px] font-medium tracking-[0.16em] text-[#94d9ca]">NEUROLOGY RESEARCH</p></div>}</div></SidebarHeader><SidebarContent className="pt-3"><SidebarMenu className="gap-1 px-3">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} tooltip={item.label} onClick={() => setLocation(item.path)} className="h-11 text-slate-300 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#195f69] data-[active=true]:text-white"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mx-5 mt-8 border-t border-white/10 pt-5 group-data-[collapsible=icon]:hidden"><div className="rounded-xl bg-white/[0.06] p-3"><p className="text-[10px] font-bold tracking-[0.14em] text-[#94d9ca]">PRIVACY FIRST</p><p className="mt-1 text-xs leading-5 text-slate-300">Use MUNR Research IDs only. Never enter names or direct identifiers.</p></div></div></SidebarContent><SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94d9ca]"><ProfileAvatar name={user?.name} logout={logout} /><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-white">{user?.name || "Registry User"}</p><p className="mt-0.5 truncate text-xs text-slate-400">{user?.role === "admin" ? "Administrator" : "Approved user"}</p></div></button></DropdownMenuTrigger></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#94d9ca]/60 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} /></div><SidebarInset className="bg-[#f7faf8]"><header className="flex h-[78px] items-center justify-between border-b border-[#e1e9e5] bg-[#fdfefd] px-5 md:px-8"><div className="flex items-center gap-3">{isMobile && <SidebarTrigger className="h-9 w-9 rounded-xl" />}<div><p className="text-[10px] font-bold tracking-[0.16em] text-[#62807e]">MANSOURA UNIVERSITY · NEUROLOGY</p><h2 className="font-display text-lg text-[#172b38]">{activeItem?.label || "Research Workspace"}</h2></div></div><div className="hidden items-center gap-2 rounded-full border border-[#dce9e6] bg-[#f3faf8] px-3 py-1.5 text-xs font-medium text-[#286069] sm:flex"><ShieldCheck className="h-3.5 w-3.5" />Pseudonymised data</div></header><main className="min-h-[calc(100vh-78px)] p-5 md:p-8">{children}</main></SidebarInset></>
  );
}
