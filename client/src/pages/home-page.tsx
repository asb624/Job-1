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

  // Handler for selecting a requirement (placeholder for now)
  const handleSelectRequirement = (requirement: Requirement) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to login to select this requirement",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    toast({
      title: "Selection feature coming soon",
      description: "The selection functionality will be implemented soon",
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-12 px-4 rounded-lg shadow-lg mb-8 transform transition-all duration-500 hover:shadow-xl">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold">Welcome to JobLo</h1>
          <p className="text-xl">
            Connect with skilled professionals or find your next project
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 btn-transition">
              {user?.isServiceProvider ? "Find Projects" : "Find Services"}
            </Button>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-blue-500 btn-transition">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-blue-50">
          <TabsTrigger value="services" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">Available Services</TabsTrigger>
          <TabsTrigger value="requirements" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-end mb-4">
            <div className="bg-blue-100 rounded-full p-1 flex gap-1 shadow-sm transition-all duration-300 hover:shadow-md">
              <Button
                variant="ghost"
                size="sm" 
                onClick={() => setViewMode('list')}
                className={`rounded-full ${viewMode === 'list' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-blue-700 hover:bg-blue-200'} transition-all duration-300`}
              >
                List View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('map')}
                className={`rounded-full ${viewMode === 'map' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-blue-700 hover:bg-blue-200'} transition-all duration-300`}
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
                onSelect={user?.isServiceProvider ? () => handleSelectRequirement(requirement) : undefined}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
