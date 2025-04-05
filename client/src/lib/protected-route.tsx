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

  // Check if this is a newly registered user (from the isNewRegistration flag)
  // If this is a newly registered user (or someone in the onboarding flow), 
  // ensure they complete the onboarding process
  const isInOnboardingFlow = sessionStorage.getItem("isInOnboardingFlow") === "true";
  
  // Only force onboarding for new registrations or users already in the flow
  if (!skipOnboardingCheck && path !== '/language-selection' && path !== '/onboarding') {
    if (isInOnboardingFlow) {
      // If they're in the onboarding flow but haven't completed it, direct them to the right step
      const hasSelectedLanguage = localStorage.getItem("preferredLanguage") !== null;
      
      if (!hasSelectedLanguage) {
        return (
          <Route path={path}>
            <Redirect to="/language-selection" />
          </Route>
        );
      }
      
      if (user.onboardingCompleted === false) {
        return (
          <Route path={path}>
            <Redirect to="/onboarding" />
          </Route>
        );
      }
      
      // If they've completed everything, clear the flag
      sessionStorage.removeItem("isInOnboardingFlow");
    }
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  )
}
