import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Performance from "./pages/Performance";
import PlaybookPage from "./pages/PlaybookPage";
import AgentPage from "./pages/AgentPage";
import OnboardingWrapper from "./pages/OnboardingWrapper";
import ZendeskApp from "./pages/ZendeskApp";
import MessagesPage from "./pages/ConversationPage";

function Router() {
  return (
    <Switch>
      {/* Main app routes */}
      <Route path="/" component={MessagesPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/performance" component={Performance} />
      <Route path="/playbook" component={PlaybookPage} />
      <Route path="/agent" component={AgentPage} />

      {/* Legacy route redirects */}
      <Route path="/conversation">
        <Redirect to="/messages" />
      </Route>
      <Route path="/inbox">
        <Redirect to="/messages" />
      </Route>
      <Route path="/settings">
        <Redirect to="/playbook" />
      </Route>

      {/* Full-width routes (bypass DashboardLayout shell) */}
      <Route path="/onboarding" component={OnboardingWrapper} />
      <Route path="/zendesk" component={ZendeskApp} />

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
