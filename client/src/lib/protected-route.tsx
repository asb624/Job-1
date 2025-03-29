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

  // Check if user has completed onboarding (unless we're specifically skipping this check)
  if (!skipOnboardingCheck && user.onboardingCompleted === false && path !== '/onboarding') {
    return (
      <Route path={path}>
        <Redirect to="/onboarding" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  )
}
