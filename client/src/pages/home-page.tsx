import { useQuery, useMutation } from "@tanstack/react-query";
import { Service, Requirement } from "@shared/schema";
import { ServiceCard } from "@/components/service-card";
import { RequirementCard } from "@/components/requirement-card";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ServiceMap } from "@/components/map/service-map";
import { useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: requirements } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
  });

  // Create a new conversation with a service provider
  const createConversationMutation = useMutation({
    mutationFn: async (providerId: number) => {
      return apiRequest("POST", "/api/conversations", { recipientId: providerId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversation created",
        description: "You can now start messaging this provider",
      });
      navigate("/messages");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler for contacting a service provider
  const handleContactProvider = (service: Service) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to login to contact service providers",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    createConversationMutation.mutate(service.providerId);
  };

  // Handler for bidding on a requirement (placeholder for now)
  const handleBidRequirement = (requirement: Requirement) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to login to place bids",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    toast({
      title: "Bid feature coming soon",
      description: "The bid functionality will be implemented soon",
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to ServiceMarket</h1>
        <p className="text-xl text-muted-foreground">
          Connect with skilled professionals or find your next project
        </p>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="services">Available Services</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-end mb-4">
            <div className="bg-secondary rounded-lg p-1 flex gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm" 
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                Map View
              </Button>
            </div>
          </div>

          {viewMode === 'map' ? (
            <ServiceMap 
              services={services || []} 
              onContactProvider={user ? handleContactProvider : undefined} 
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services?.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onContact={user ? () => handleContactProvider(service) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requirements">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requirements?.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                onBid={user?.isServiceProvider ? () => handleBidRequirement(requirement) : undefined}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
