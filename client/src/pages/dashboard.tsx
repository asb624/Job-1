import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Service, Requirement, Bid as Selection } from "@shared/schema";
import { ServiceCard } from "@/components/service-card";
import { RequirementCard } from "@/components/requirement-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBidSchema as insertSelectionSchema } from "@shared/schema";
import { subscribeToMessages } from "@/lib/websocket";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Setup realtime updates
  useEffect(() => {
    subscribeToMessages((message) => {
      if (message.type === "selection" || message.type === "status") {
        queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      }
    });
  }, []);

  // Fetch data based on user type
  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: user?.isServiceProvider,
  });

  const { data: requirements } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
    enabled: !user?.isServiceProvider,
  });

  const createSelectionMutation = useMutation({
    mutationFn: async (data: any) => {
      // We're using "selections" in our UI, but the backend still uses "bids"
      const res = await apiRequest("POST", "/api/bids", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Note: API still uses "bids", though our UI uses "selections"
      queryClient.invalidateQueries({ queryKey: ["/api/requirements", variables.requirementId, "bids"] });
      toast({
        title: "Selection Submitted",
        description: "Your selection has been submitted successfully.",
      });
    },
  });

  const SelectionDialog = ({ requirement }: { requirement: Requirement }) => {
    const form = useForm({
      resolver: zodResolver(insertSelectionSchema),
      defaultValues: {
        requirementId: requirement.id,
        amount: 0,
        message: "",
      },
    });

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">Select</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select This Requirement</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createSelectionMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain your proposal..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createSelectionMutation.isPending}>
                Submit Selection
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.isServiceProvider ? "Service Provider Dashboard" : "Client Dashboard"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.isServiceProvider ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Your Services</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services?.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Your Requirements</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requirements?.map((requirement) => (
                  <div key={requirement.id}>
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                    />
                    {user?.isServiceProvider && requirement.status === "open" && (
                      <SelectionDialog requirement={requirement} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
