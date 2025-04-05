import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  skipOnboardingCheck = false,
}: {
  path: string;
  component: React.ComponentType;
  skipOnboardingCheck?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Determine if the user is in the onboarding flow
  const isInOnboardingFlow = sessionStorage.getItem("isInOnboardingFlow") === "true";
  // Determine if this is a new registration (this flag is set during registration)
  const isNewRegistration = localStorage.getItem("isNewRegistration") === "true";
  
  // Only enforce onboarding for these conditions:
  // 1. User has explicitly opted into the flow (isInOnboardingFlow)
  // 2. User is newly registered and hasn't completed onboarding
  // 3. We're not already on an onboarding-related page
  if (!skipOnboardingCheck && 
      path !== '/language-selection' && 
      path !== '/onboarding') {
    
    // For newly registered users or users in the onboarding flow
    if (isInOnboardingFlow || (isNewRegistration && user.onboardingCompleted === false)) {
      // First, check if they've selected a language
      const hasSelectedLanguage = localStorage.getItem("preferredLanguage") !== null;
      
      if (!hasSelectedLanguage) {
        return (
          <Route path={path}>
            <Redirect to="/language-selection" />
          </Route>
        );
      }
      
      // Then, check if they've completed onboarding
      if (user.onboardingCompleted === false) {
        return (
          <Route path={path}>
            <Redirect to="/onboarding" />
          </Route>
        );
      }
      
      // If they've completed everything:
      // 1. Clear the onboarding flow flag
      sessionStorage.removeItem("isInOnboardingFlow");
      // 2. Clear the new registration flag
      localStorage.removeItem("isNewRegistration");
    }
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  )
}
