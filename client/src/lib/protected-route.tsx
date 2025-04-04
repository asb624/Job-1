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

  // Check if user needs to go through language selection and onboarding flow
  // If this is a newly registered user, send them to language selection first
  const hasSelectedLanguage = localStorage.getItem("preferredLanguage") !== null;
  
  if (!skipOnboardingCheck && path !== '/language-selection' && path !== '/onboarding') {
    // First check if they need language selection
    if (!hasSelectedLanguage) {
      return (
        <Route path={path}>
          <Redirect to="/language-selection" />
        </Route>
      );
    }
    
    // Then check if they need onboarding
    if (user.onboardingCompleted === false) {
      return (
        <Route path={path}>
          <Redirect to="/onboarding" />
        </Route>
      );
    }
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  )
}
