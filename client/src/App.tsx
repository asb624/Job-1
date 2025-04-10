import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-websocket-notifications";
import { ThemeProvider } from "./lib/theme-context";
import { ColorPaletteProvider } from "./lib/color-palette-context";
import { ProtectedRoute } from "./lib/protected-route";
import { NavBar } from "./components/nav-bar";
import { ContextualSidebar } from "./components/contextual-sidebar";
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
import LanguageSelectionPage from "@/pages/language-selection";
import PreferencesPage from "@/pages/preferences";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/language-selection" component={LanguageSelectionPage} skipOnboardingCheck={true} />
      <ProtectedRoute path="/onboarding" component={OnboardingPage} skipOnboardingCheck={true} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/post-requirement" component={PostRequirement} skipOnboardingCheck={true} />
      <ProtectedRoute path="/post-service" component={PostService} skipOnboardingCheck={true} />
      <ProtectedRoute path="/profile" component={Profile} /> 
      <ProtectedRoute path="/messages" component={MessagesPage} skipOnboardingCheck={true} />
      <ProtectedRoute path="/preferences" component={PreferencesPage} />
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
        <ColorPaletteProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NotificationProvider>
                <div className="min-h-screen theme-transition flex w-full max-w-[100vw] overflow-hidden">
                  <ContextualSidebar />
                  <div className="flex-1 flex flex-col overflow-x-hidden">
                    <NavBar />
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                      <Router />
                    </main>
                  </div>
                </div>
                <Toaster />
              </NotificationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ColorPaletteProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;