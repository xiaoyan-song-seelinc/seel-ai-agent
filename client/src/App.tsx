import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import Guardrails from "./pages/Guardrails";
import Watchtower from "./pages/Watchtower";
import Onboarding from "./pages/Onboarding";
import Conversations from "./pages/Conversations";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/:id" component={AgentDetail} />
      <Route path="/tickets" component={Tickets} />
      <Route path="/tickets/:id" component={TicketDetail} />
      <Route path="/conversations" component={Conversations} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/guardrails" component={Guardrails} />
      <Route path="/watchtower" component={Watchtower} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
