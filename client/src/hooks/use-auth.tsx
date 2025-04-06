import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log("Logging in user:", credentials.username);
        
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Login response not OK:", res.status, errorText);
          throw new Error(errorText || "Login failed");
        }
        
        console.log("Login successful, parsing response...");
        
        // For login, make sure to clear these flags to avoid onboarding for returning users
        // A returning user should never go through the language selection or onboarding flow
        localStorage.removeItem("isNewRegistration");
        sessionStorage.removeItem("isInOnboardingFlow");
        
        // Don't clear preferredLanguage during login to preserve user's language preference
        // preferredLanguage will be set during language selection for new users
        // but for returning users we want to keep their previously selected language
        
        const user = await res.json() as SelectUser;
        console.log("User logged in with ID:", user.id, "onboardingCompleted:", user.onboardingCompleted);
        
        return user;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Login mutation successful, updating query cache");
      
      // Set the user in the query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // We intentionally don't invalidate the query here as that could cause
      // the auth state to be refreshed before navigation occurs
      // Instead, we'll manually set the data and let the navigation happen first
      
      console.log("Login flow complete, auth page will handle redirect");
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        console.log("Registering user:", credentials.username);
        
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Registration response not OK:", res.status, errorText);
          throw new Error(errorText || "Registration failed");
        }
        
        console.log("Registration successful, parsing response...");
        const user = await res.json() as SelectUser;
        console.log("User created with ID:", user.id);
        
        // Mark this as a new registration and set the onboarding flow flag
        // These flags will be used to route the user through language selection and onboarding
        localStorage.setItem("isNewRegistration", "true");
        sessionStorage.setItem("isInOnboardingFlow", "true");
        
        // Clear any existing language preference for new registrations
        // This ensures they go through the language selection process
        localStorage.removeItem("preferredLanguage");
        
        console.log("Registration flags set, returning user");
        return user;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Registration mutation successful, updating query cache");
      
      // Set the user in the query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // We intentionally don't invalidate the query here as that could cause
      // the auth state to be refreshed before navigation occurs
      // Instead, we'll manually set the data and let the navigation happen first
      
      // NOTE: We don't clear flags for registration success
      // The flags need to persist so the user can be directed to language selection
      // and then onboarding
      
      // The flags will be cleared after onboarding completes
      // or in the login mutation (for returning users)
      
      // We'll handle redirection in the auth page component instead
      // to properly maintain session context
      console.log("Registration flow complete, auth page will handle redirect");
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Logout failed");
        }
        
        return;
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
