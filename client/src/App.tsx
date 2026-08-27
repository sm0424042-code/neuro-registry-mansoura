import { Toaster } from "@/components/ui/sonner";
import React, { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));
const AccessManagement = lazy(() => import("@/pages/AccessManagement"));
const CompletionTasks = lazy(() => import("@/pages/CompletionTasks"));
const Home = lazy(() => import("@/pages/Home"));
const Messages = lazy(() => import("@/pages/Messages"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PatientEditor = lazy(() => import("@/pages/PatientEditor"));
const PatientRegistry = lazy(() => import("@/pages/PatientRegistry"));
const PublicWorkflowPreview = lazy(() => import("@/pages/PublicWorkflowPreview"));
const RegistryStatistics = lazy(() => import("@/pages/RegistryStatistics"));

function RouteLoading() {
  return <main className="grid min-h-screen place-items-center bg-[#f6faf8] px-5 text-[#24434b]" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-2xl border border-[#d5e8e3] bg-white px-5 py-4 shadow-sm"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#61b4a7] border-t-transparent motion-reduce:animate-none" /><span className="text-sm font-medium">Loading workspace…</span></div></main>;
}

function RouteBoundary({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <RouteBoundary><DashboardLayout>{children}</DashboardLayout></RouteBoundary>;
}

function Router() {
  return (
    <Switch>
      <Route path="/workflow-preview">{() => <RouteBoundary><PublicWorkflowPreview /></RouteBoundary>}</Route>
      <Route path="/">{() => <ProtectedPage><Home /></ProtectedPage>}</Route>
      <Route path="/statistics">{() => <ProtectedPage><RegistryStatistics /></ProtectedPage>}</Route>
      <Route path="/registry">{() => <ProtectedPage><PatientRegistry /></ProtectedPage>}</Route>
      <Route path="/messages">{() => <ProtectedPage><Messages /></ProtectedPage>}</Route>
      <Route path="/tasks">{() => <ProtectedPage><CompletionTasks /></ProtectedPage>}</Route>
      <Route path="/records/new">{() => <ProtectedPage><PatientEditor mode="create" /></ProtectedPage>}</Route>
      <Route path="/records/:id">{({ id }) => <ProtectedPage><PatientEditor mode="edit" recordId={Number(id)} /></ProtectedPage>}</Route>
      <Route path="/access">{() => <ProtectedPage><AccessManagement /></ProtectedPage>}</Route>
      <Route path="/404">{() => <RouteBoundary><NotFound /></RouteBoundary>}</Route>
      <Route>{() => <RouteBoundary><NotFound /></RouteBoundary>}</Route>
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="bottom-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
