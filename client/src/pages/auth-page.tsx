import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { insertUserSchema, type InsertUser } from "@shared/schema";

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  const loginForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Watch for successful login/registration and redirect accordingly
  useEffect(() => {
    if (user) {
      console.log("User detected in auth page, handling navigation");
      console.log("User data:", user);
      console.log("isNewRegistration:", localStorage.getItem('isNewRegistration'));
      console.log("isInOnboardingFlow:", sessionStorage.getItem('isInOnboardingFlow'));
      console.log("preferredLanguage:", localStorage.getItem('preferredLanguage'));
      console.log("onboardingCompleted:", user.onboardingCompleted);
      
      // Check if this is a new registration
      const isNewRegistration = localStorage.getItem('isNewRegistration') === 'true';
      
      if (isNewRegistration) {
        console.log("This is a new registration, redirecting to language selection");
        // For new registrations, direct to language selection
        // Don't clear the flag here - we need it to persist through the onboarding flow
        // It will be cleared after onboarding completes
        setLocation('/language-selection');
      } else {
        // For regular logins, check if they ever completed onboarding
        if (user.onboardingCompleted) {
          console.log("This is a returning user with completed onboarding, redirecting to dashboard");
          // If onboarding was previously completed, go directly to dashboard
          setLocation('/dashboard');
        } else {
          // If returning user that never completed onboarding
          const preferredLanguage = localStorage.getItem('preferredLanguage');
          
          if (preferredLanguage) {
            console.log("This is a returning user with incomplete onboarding but has language preference, redirecting to onboarding");
            // If they have a language preference, continue with onboarding
            sessionStorage.setItem('isInOnboardingFlow', 'true');
            setLocation('/onboarding');
          } else {
            console.log("This is a returning user with incomplete onboarding and no language preference, redirecting to language selection");
            // If they don't have a language preference, start with language selection
            sessionStorage.setItem('isInOnboardingFlow', 'true');
            setLocation('/language-selection');
          }
        }
      }
    }
  }, [user, setLocation]);

  if (user) {
    // Return null to prevent rendering while redirect happens
    return null;
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Job Bazaar</CardTitle>
          <CardDescription>
            Connect with service providers or offer your services in your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    Login
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit((data) =>
                    registerMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <div className="text-xs text-gray-500 mb-2 bg-blue-50 p-2 rounded">
                    After registration, you'll be able to select your preferred language from our 17 supported Indian languages.
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    Register
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
