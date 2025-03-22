import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertProfileSchema, Profile as ProfileType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<ProfileType>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile");
      return res.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      bio: profile?.bio || "",
      skills: profile?.skills || [],
      portfolioLinks: profile?.portfolioLinks || [],
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileType>) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your profile information and visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                updateProfileMutation.mutate(data)
              )}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell others about yourself..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Skills</FormLabel>
                {profile?.skills?.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="mr-2">
                    {skill}
                  </Badge>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </div>

              <div className="space-y-4">
                <FormLabel>Portfolio Links</FormLabel>
                {profile?.portfolioLinks?.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={link} readOnly />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {user?.isServiceProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>
              Verify your account to build trust with potential clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant={profile?.isVerified ? "default" : "secondary"}>
                {profile?.isVerified ? "Verified" : "Not Verified"}
              </Badge>
              {!profile?.isVerified && (
                <Button variant="outline" size="sm">
                  Start Verification
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
