import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-websocket-notifications";
import { ThemeProvider } from "./lib/theme-context";
import { ColorPaletteProvider } from "./lib/color-palette-context";
import { ProtectedRoute } from "./lib/protected-route";
import { CallProvider } from "./components/call/call-provider";
import { CallInterface } from "./components/call/call-interface";
import { NavBar } from "./components/nav-bar";
import { ContextualSidebar } from "./components/contextual-sidebar";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { useEffect, useState } from "react";

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

// This component acts as a feature flag system to control what features are enabled
function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  // Start with WebSockets disabled to ensure the app loads first
  const [enableWebSockets, setEnableWebSockets] = useState(false);
  const [enableCallFeature, setEnableCallFeature] = useState(false);

  useEffect(() => {
    // Enable WebSockets after the app has loaded properly
    const timeoutId = setTimeout(() => {
      console.log('Enabling WebSocket features');
      setEnableWebSockets(true);
    }, 2000);

    // Enable call features slightly later to ensure WebSockets are ready
    const callTimeoutId = setTimeout(() => {
      console.log('Enabling call features');
      setEnableCallFeature(true);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(callTimeoutId);
    };
  }, []);

  // Make these flags available to components that need them
  (window as any).__featureFlags = {
    enableWebSockets,
    enableCallFeature
  };

  return <>{children}</>;
}

function App() {
  // Flag to track if the app has rendered at least once
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    // Mark the app as initialized after first render
    setAppInitialized(true);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <ColorPaletteProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <FeatureFlagProvider>
                {/* Only render real-time features once app is initialized */}
                {appInitialized ? (
                  <>
                    <NotificationProvider>
                      <CallProvider>
                        <div className="min-h-screen theme-transition flex">
                          <ContextualSidebar />
                          <div className="flex-1 flex flex-col">
                            <NavBar />
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                              <Router />
                            </main>
                          </div>
                        </div>
                        <CallInterface />
                        <Toaster />
                      </CallProvider>
                    </NotificationProvider>
                  </>
                ) : (
                  // Render a basic structure while initializing to ensure the app loads
                  <div className="min-h-screen theme-transition flex">
                    <div className="flex-1 flex flex-col">
                      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                        <Router />
                      </main>
                    </div>
                    <Toaster />
                  </div>
                )}
              </FeatureFlagProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ColorPaletteProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;