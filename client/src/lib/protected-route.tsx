import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

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
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  // Add a delay timer to prevent immediate redirects that might cause race conditions
  const [checkCompleted, setCheckCompleted] = useState(false);

  useEffect(() => {
    // Only run this effect when we have a non-loading user state
    if (!isLoading) {
      console.log(`ProtectedRoute (${path}) - User state:`, user ? `Logged in (ID: ${user.id})` : 'Not logged in');
      
      // If no user, we'll redirect to auth in the render phase
      if (!user) {
        setCheckCompleted(true);
        return;
      }
      
      // Only check onboarding status if this route requires it
      if (!skipOnboardingCheck && 
          path !== '/language-selection' && 
          path !== '/onboarding') {
        
        console.log(`ProtectedRoute (${path}) - Checking onboarding status`);
        
        // Determine if the user is in the onboarding flow
        const isInOnboardingFlow = sessionStorage.getItem("isInOnboardingFlow") === "true";
        // Determine if this is a new registration
        const isNewRegistration = localStorage.getItem("isNewRegistration") === "true";
        // Check if they've selected a language
        const hasSelectedLanguage = localStorage.getItem("preferredLanguage") !== null;
        
        console.log(`ProtectedRoute - isInOnboardingFlow: ${isInOnboardingFlow}, isNewRegistration: ${isNewRegistration}, onboardingCompleted: ${user.onboardingCompleted}, hasSelectedLanguage: ${hasSelectedLanguage}`);
        
        // For newly registered users or users in the onboarding flow
        if (isInOnboardingFlow || (isNewRegistration && user.onboardingCompleted === false)) {
          // First, check if they've selected a language
          if (!hasSelectedLanguage) {
            console.log(`ProtectedRoute (${path}) - No language selected, redirecting to language selection`);
            setRedirectPath('/language-selection');
            setCheckCompleted(true);
            return;
          }
          
          // Then, check if they've completed onboarding
          if (user.onboardingCompleted === false) {
            console.log(`ProtectedRoute (${path}) - Onboarding not completed, redirecting to onboarding`);
            setRedirectPath('/onboarding');
            setCheckCompleted(true);
            return;
          }
          
          // If they've completed everything:
          console.log(`ProtectedRoute (${path}) - Onboarding complete, clearing flags`);
          // 1. Clear the onboarding flow flag
          sessionStorage.removeItem("isInOnboardingFlow");
          // 2. Clear the new registration flag
          localStorage.removeItem("isNewRegistration");
        }
      }
      
      // If we reached here, no redirect is needed
      setCheckCompleted(true);
    }
  }, [user, isLoading, path, skipOnboardingCheck]);

  if (isLoading || !checkCompleted) {
    console.log(`ProtectedRoute (${path}) - Loading user data or waiting for checks to complete...`);
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log(`ProtectedRoute (${path}) - No user, redirecting to auth`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (redirectPath) {
    console.log(`ProtectedRoute (${path}) - Redirecting to ${redirectPath}`);
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  console.log(`ProtectedRoute (${path}) - Rendering component`);
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
