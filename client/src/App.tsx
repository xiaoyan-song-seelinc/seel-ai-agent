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

function Router() {
  return (
    <Switch>
      {/* AI Support module — default landing is Agents (formerly Communication) */}
      <Route path="/" component={CommunicationPage} />
      <Route path="/communication" component={CommunicationPage} />
      <Route path="/playbook" component={PlaybookPage} />
      <Route path="/performance" component={Performance} />
      <Route path="/performance/conversations" component={Performance} />

      {/* Global pages */}
      <Route path="/integrations" component={IntegrationsPage} />

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
          <TooltipProvider>
            <Toaster />
            <DashboardLayout>
              <Router />
            </DashboardLayout>
          </TooltipProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
