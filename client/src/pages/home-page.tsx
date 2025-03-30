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
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { t } = useTranslation();

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
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-400 text-white py-10 sm:py-16 px-4 sm:px-6 rounded-md shadow-xl mb-6 sm:mb-8 transform transition-all duration-500 hover:shadow-2xl">
        {/* Background decorative patterns - hidden on small screens */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 hidden sm:block">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border-4 border-white"></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full border-4 border-white"></div>
        </div>
        
        <div className="relative text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">{t("app.title")}</h1>
          <p className="text-lg sm:text-xl font-light">
            {t("app.tagline")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5 mt-6 sm:mt-8">
            <Button className="w-full sm:w-auto bg-white text-teal-600 hover:bg-teal-50 transform hover:-translate-y-1 transition-all duration-300 px-6 py-2.5 font-medium rounded-md">
              {user?.isServiceProvider ? t("Find Projects") : t("Find Services")}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0 bg-transparent border-2 border-white text-white hover:bg-teal-500 transform hover:-translate-y-1 transition-all duration-300 px-6 py-2.5 font-medium rounded-md">
              {t("Learn More")}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-[90%] sm:max-w-md mx-auto grid-cols-2 bg-teal-50 rounded-xl border border-teal-100 p-1">
          <TabsTrigger 
            value="services" 
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-teal-700 rounded-lg transition-all duration-300 text-sm sm:text-base px-2 py-1.5"
          >
            {t("services.title")}
          </TabsTrigger>
          <TabsTrigger 
            value="requirements" 
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-teal-700 rounded-lg transition-all duration-300 text-sm sm:text-base px-2 py-1.5"
          >
            {t("requirements.title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
          <div className="flex justify-center sm:justify-end mb-3 sm:mb-4">
            <div className="bg-teal-50 rounded-xl p-1.5 flex gap-2 shadow-sm transition-all duration-300 hover:shadow-md border border-teal-100">
              <Button
                variant="ghost"
                size="sm" 
                onClick={() => setViewMode('list')}
                className={`rounded-lg ${viewMode === 'list' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'text-teal-700 hover:bg-teal-100'} transition-all duration-300 font-medium text-xs sm:text-sm px-2 sm:px-3`}
              >
                {t("services.listView")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('map')}
                className={`rounded-lg ${viewMode === 'map' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'text-teal-700 hover:bg-teal-100'} transition-all duration-300 font-medium text-xs sm:text-sm px-2 sm:px-3`}
              >
                {t("services.mapView")}
              </Button>
            </div>
          </div>

          {viewMode === 'map' ? (
            <div className="rounded-xl overflow-hidden border border-teal-100 shadow-md">
              <ServiceMap 
                services={services || []} 
                onContactProvider={user ? handleContactProvider : undefined} 
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {services?.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onContact={user ? () => handleContactProvider(service) : undefined}
                />
              ))}
              {(services?.length || 0) === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-10 text-center">
                  <p className="text-teal-600 font-medium">{t("No services available at the moment")}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requirements">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4">
            {requirements?.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                onSelect={user ? () => handleSelectRequirement(requirement) : undefined}
              />
            ))}
            {(requirements?.length || 0) === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-10 text-center">
                <p className="text-teal-600 font-medium">{t("No requirements available at the moment")}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* AI Chatbot */}
      <ChatbotUI />
    </div>
  );
}
