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
import { ChatbotUI } from "@/components/ai-chatbot/chatbot-ui";

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
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-400 text-white py-16 px-6 rounded-md shadow-xl mb-8 transform transition-all duration-500 hover:shadow-2xl">
        {/* Background decorative patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border-4 border-white"></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full border-4 border-white"></div>
        </div>
        
        <div className="relative text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight">Welcome to JobLo</h1>
          <p className="text-xl font-light">
            Connect with skilled professionals or find your next project
          </p>
          <div className="flex flex-wrap justify-center gap-5 mt-8">
            <Button className="bg-white text-teal-600 hover:bg-teal-50 transform hover:-translate-y-1 transition-all duration-300 px-6 py-2.5 font-medium rounded-md">
              {user?.isServiceProvider ? "Find Projects" : "Find Services"}
            </Button>
            <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-teal-500 transform hover:-translate-y-1 transition-all duration-300 px-6 py-2.5 font-medium rounded-md">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-teal-50 rounded-xl border border-teal-100 p-1">
          <TabsTrigger 
            value="services" 
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-teal-700 rounded-lg transition-all duration-300"
          >
            Available Services
          </TabsTrigger>
          <TabsTrigger 
            value="requirements" 
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-teal-700 rounded-lg transition-all duration-300"
          >
            Requirements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6 pt-6">
          <div className="flex justify-end mb-4">
            <div className="bg-teal-50 rounded-xl p-1.5 flex gap-2 shadow-sm transition-all duration-300 hover:shadow-md border border-teal-100">
              <Button
                variant="ghost"
                size="sm" 
                onClick={() => setViewMode('list')}
                className={`rounded-lg ${viewMode === 'list' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'text-teal-700 hover:bg-teal-100'} transition-all duration-300 font-medium`}
              >
                List View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('map')}
                className={`rounded-lg ${viewMode === 'map' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'text-teal-700 hover:bg-teal-100'} transition-all duration-300 font-medium`}
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
      
      {/* AI Chatbot */}
      <ChatbotUI />
    </div>
  );
}
