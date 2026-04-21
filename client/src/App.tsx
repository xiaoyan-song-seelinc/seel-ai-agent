import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StoreProvider } from "./lib/store";
import DashboardLayout from "./components/DashboardLayout";
import Performance from "./pages/Performance";
import PlaybookPage from "./pages/PlaybookPage";
import ZendeskApp from "./pages/ZendeskApp";
import CommunicationPage from "./pages/CommunicationPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SalesAgentPage from "./pages/SalesAgentPage";
import { SalesAgentProvider } from "./lib/sales-agent/store";

function Router() {
  return (
    <Switch>
      {/* Default landing is Sales Agent */}
      <Route path="/">
        <Redirect to="/sales-agent" />
      </Route>

      {/* AI Support module */}
      <Route path="/communication" component={CommunicationPage} />
      <Route path="/playbook" component={PlaybookPage} />
      <Route path="/performance" component={Performance} />
      <Route path="/performance/conversations" component={Performance} />

      {/* Global pages */}
      <Route path="/integrations" component={IntegrationsPage} />

      {/* Sales Agent module */}
      <Route path="/sales-agent" component={SalesAgentPage} />
      <Route path="/sales-agent/:tab" component={SalesAgentPage} />

      {/* Legacy redirects */}
      <Route path="/messages">
        <Redirect to="/communication" />
      </Route>
      <Route path="/agent">
        <Redirect to="/communication" />
      </Route>
      <Route path="/config">
        <Redirect to="/communication" />
      </Route>
      <Route path="/settings">
        <Redirect to="/playbook" />
      </Route>
      <Route path="/onboarding">
        <Redirect to="/" />
      </Route>

      {/* Zendesk sidebar — standalone, bypasses DashboardLayout */}
      <Route path="/zendesk" component={ZendeskApp} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <StoreProvider>
          <SalesAgentProvider>
            <TooltipProvider>
              <Toaster />
              <DashboardLayout>
                <Router />
              </DashboardLayout>
            </TooltipProvider>
          </SalesAgentProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
