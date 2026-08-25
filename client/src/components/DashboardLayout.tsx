import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, ClipboardList, LayoutDashboard, LogOut, PanelLeft, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: ClipboardList, label: "Patient Registry", path: "/registry" },
  { icon: Plus, label: "New Record", path: "/records/new" },
];
const SIDEBAR_WIDTH_KEY = "egr-sidebar-width";
const DEFAULT_WIDTH = 276;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

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
      <div className="fade-rise max-w-md overflow-hidden rounded-[1.7rem] border border-[#dce8e4] bg-white shadow-[0_28px_80px_rgba(17,43,56,0.14)]">
        <div className="bg-[#0b1d2a] px-8 py-9 text-white"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#94d9ca] text-[#0b1d2a]"><Activity className="h-5 w-5" /></span><span className="font-display text-xl">Egypt Neuro Registry</span></div><p className="mt-5 text-sm leading-6 text-slate-300">A protected research environment for pseudonymised neurological patient records.</p></div>
        <div className="p-8"><h1 className="font-display text-2xl text-[#172b38]">Authorised access only</h1><p className="mt-3 text-sm leading-6 text-slate-500">Sign in to request or use approved access. Patient records are available only to authorised research personnel.</p><Button onClick={() => startLogin()} className="mt-7 w-full bg-[#125d69] hover:bg-[#0d4b55]">Sign in securely</Button></div>
      </div>
    </div>
  );
}

function AccessPending({ status, logout }: { status: "pending" | "suspended"; logout: () => void }) {
  const suspended = status === "suspended";
  return (
    <div className="clinical-grid min-h-screen bg-[#edf3f1] p-5 flex items-center justify-center"><div className="fade-rise max-w-lg rounded-[1.7rem] border border-[#dce8e4] bg-white p-9 shadow-[0_28px_80px_rgba(17,43,56,0.14)]"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${suspended ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}><ShieldCheck className="h-6 w-6" /></div><h1 className="mt-6 font-display text-3xl text-[#172b38]">{suspended ? "Access is suspended" : "Access approval required"}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{suspended ? "This account is not currently permitted to enter the registry. Please contact a registry administrator." : "Your account has been created but has not yet been approved by a registry administrator. No patient records are visible until approval is granted."}</p><Button variant="outline" onClick={logout} className="mt-7">Sign out</Button></div></div>
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
    <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-[#1a3544] bg-[#0b1d2a] text-slate-100" disableTransition={isResizing}><SidebarHeader className="h-[78px] px-3 justify-center"><div className="flex items-center gap-3"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#b7d6d2] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94d9ca]" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><p className="font-display text-[17px] leading-none text-white">Egypt Neuro</p><p className="mt-1 text-[10px] font-medium tracking-[0.16em] text-[#94d9ca]">RESEARCH REGISTRY</p></div>}</div></SidebarHeader><SidebarContent className="pt-3"><SidebarMenu className="gap-1 px-3">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} tooltip={item.label} onClick={() => setLocation(item.path)} className="h-11 text-slate-300 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#195f69] data-[active=true]:text-white"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mx-5 mt-8 border-t border-white/10 pt-5 group-data-[collapsible=icon]:hidden"><div className="rounded-xl bg-white/[0.06] p-3"><p className="text-[10px] font-bold tracking-[0.14em] text-[#94d9ca]">PRIVACY FIRST</p><p className="mt-1 text-xs leading-5 text-slate-300">Use Research IDs only. Never enter names or direct identifiers.</p></div></div></SidebarContent><SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94d9ca]"><Avatar className="h-9 w-9 shrink-0 border border-white/15"><AvatarFallback className="bg-[#1c4650] text-xs text-white">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium text-white">{user?.name || "Registry User"}</p><p className="mt-0.5 truncate text-xs text-slate-400">{user?.role === "admin" ? "Administrator" : "Approved user"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#94d9ca]/60 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} /></div><SidebarInset className="bg-[#f7faf8]"><header className="flex h-[78px] items-center justify-between border-b border-[#e1e9e5] bg-[#fdfefd] px-5 md:px-8"><div className="flex items-center gap-3">{isMobile && <SidebarTrigger className="h-9 w-9 rounded-xl" />}<div><p className="text-[10px] font-bold tracking-[0.16em] text-[#62807e]">EGYPT NEURO REGISTRY</p><h2 className="font-display text-lg text-[#172b38]">{activeItem?.label || "Research Workspace"}</h2></div></div><div className="hidden items-center gap-2 rounded-full border border-[#dce9e6] bg-[#f3faf8] px-3 py-1.5 text-xs font-medium text-[#286069] sm:flex"><ShieldCheck className="h-3.5 w-3.5" />Pseudonymised data</div></header><main className="min-h-[calc(100vh-78px)] p-5 md:p-8">{children}</main></SidebarInset></>
  );
}
