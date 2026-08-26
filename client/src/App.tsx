import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import AccessManagement from "@/pages/AccessManagement";
import Home from "@/pages/Home";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/NotFound";
import PatientEditor from "@/pages/PatientEditor";
import PatientRegistry from "@/pages/PatientRegistry";
import PublicWorkflowPreview from "@/pages/PublicWorkflowPreview";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/workflow-preview" component={PublicWorkflowPreview} />
      <Route path="/">{() => <ProtectedPage><Home /></ProtectedPage>}</Route>
      <Route path="/registry">{() => <ProtectedPage><PatientRegistry /></ProtectedPage>}</Route>
      <Route path="/messages">{() => <ProtectedPage><Messages /></ProtectedPage>}</Route>
      <Route path="/records/new">{() => <ProtectedPage><PatientEditor mode="create" /></ProtectedPage>}</Route>
      <Route path="/records/:id">{({ id }) => <ProtectedPage><PatientEditor mode="edit" recordId={Number(id)} /></ProtectedPage>}</Route>
      <Route path="/access">{() => <ProtectedPage><AccessManagement /></ProtectedPage>}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
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
