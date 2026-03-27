import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Inbox from "./pages/Instruct";
import Performance from "./pages/Performance";
import PlaybookPage from "./pages/PlaybookPage";
import OnboardingWrapper from "./pages/OnboardingWrapper";
import ZendeskApp from "./pages/ZendeskApp";
import ConversationPage from "./pages/ConversationPage";

function Router() {
  return (
    <Switch>
      {/* Main app routes */}
      <Route path="/" component={ConversationPage} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/performance" component={Performance} />
      <Route path="/playbook" component={PlaybookPage} />
      <Route path="/conversation" component={ConversationPage} />

      {/* Legacy route redirect */}
      <Route path="/settings">
        {() => {
          window.location.href = "/playbook";
          return null;
        }}
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
