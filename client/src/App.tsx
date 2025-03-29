import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-websocket-notifications";
import { ThemeProvider } from "./lib/theme-context";
import { ProtectedRoute } from "./lib/protected-route";
import { NavBar } from "./components/nav-bar";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import PostRequirement from "@/pages/post-requirement";
import PostService from "@/pages/post-service";
import Profile from "@/pages/profile"; 
import MessagesPage from "@/pages/messages";
import OnboardingPage from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} skipOnboardingCheck={true} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/post-requirement" component={PostRequirement} />
      <ProtectedRoute path="/post-service" component={PostService} />
      <ProtectedRoute path="/profile" component={Profile} /> 
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <div className="min-h-screen theme-transition">
                <NavBar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Router />
                </main>
              </div>
              <Toaster />
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;