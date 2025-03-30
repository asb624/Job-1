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
import { useState, useEffect } from "react";
import { ChatbotUI } from "@/components/ai-chatbot/chatbot-ui";
import { useTranslation } from "react-i18next";
import { preloadTranslations } from "@/lib/translation-utils";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { t, i18n } = useTranslation();

  const { data: services, isSuccess: servicesLoaded } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: requirements, isSuccess: requirementsLoaded } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
  });
  
  // Preload translations for all service and requirement cards in batches
  useEffect(() => {
    // Only try to preload when data is loaded and we're not in English
    if (i18n.language !== 'en') {
      if (servicesLoaded && services && services.length > 0) {
        const textsToTranslate: string[] = [];
        
        // Collect all texts that need translation from services
        services.forEach(service => {
          if (service.title) textsToTranslate.push(service.title);
          if (service.description) textsToTranslate.push(service.description);
          if (service.city) textsToTranslate.push(service.city);
          if (service.state) textsToTranslate.push(service.state);
        });
        
        // Preload translations in batch
        preloadTranslations(textsToTranslate, i18n.language)
          .catch(err => console.error('Error preloading service translations:', err));
      }
      
      if (requirementsLoaded && requirements && requirements.length > 0) {
        const textsToTranslate: string[] = [];
        
        // Collect all texts that need translation from requirements
        requirements.forEach(req => {
          if (req.title) textsToTranslate.push(req.title);
          if (req.description) textsToTranslate.push(req.description);
          if (req.city) textsToTranslate.push(req.city);
          if (req.state) textsToTranslate.push(req.state);
        });
        
        // Preload translations in batch
        preloadTranslations(textsToTranslate, i18n.language)
          .catch(err => console.error('Error preloading requirement translations:', err));
      }
    }
  }, [services, requirements, i18n.language, servicesLoaded, requirementsLoaded]);

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
          <p className="text-lg sm:text-xl font-light mb-4">
            {t("app.tagline")}
          </p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-lg border border-teal-100 bg-white">
        {/* Elegant Header with Animated Background */}
        <div className="relative p-6 bg-gradient-to-r from-teal-600 to-emerald-500 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full border-4 border-white"></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full border-4 border-white"></div>
            <div className="absolute bottom-0 right-10 w-32 h-32 rounded-full border-4 border-white"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{t("marketplace.browse")}</h2>
                <p className="text-teal-50 text-sm sm:text-base mt-1 max-w-xl">
                  {t("marketplace.description")}
                </p>
              </div>
              
              {/* Quick Post Button - Always Visible */}
              <Button 
                className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => navigate(user?.isServiceProvider ? "/post-requirement" : "/post-service")}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-teal-600 text-white p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </span>
                  {user?.isServiceProvider ? t("Post Requirement") : t("Post Service")}
                </div>
              </Button>
            </div>
            
            {/* Enhanced Tab Navigation - Custom Design */}
            <div className="mt-6 flex items-center">
              <div className="flex bg-white/20 p-1 rounded-xl">
                <button
                  onClick={() => {
                    // Use querySelector and type assertion to HTMLButtonElement
                    const servicesTab = document.querySelector('[data-tabs-trigger="services"]') as HTMLButtonElement;
                    if (servicesTab) servicesTab.click();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                    document.querySelector('[data-state="active"][data-tabs-trigger="services"]') 
                      ? 'bg-white text-teal-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t("services.title")}
                </button>
                <button
                  onClick={() => {
                    // Use querySelector and type assertion to HTMLButtonElement
                    const requirementsTab = document.querySelector('[data-tabs-trigger="requirements"]') as HTMLButtonElement;
                    if (requirementsTab) requirementsTab.click();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                    document.querySelector('[data-state="active"][data-tabs-trigger="requirements"]') 
                      ? 'bg-white text-teal-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t("requirements.title")}
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="ml-auto relative hidden sm:block">
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder={t("marketplace.search")}
                    className="bg-transparent border-none text-white placeholder-white/70 focus:outline-none text-sm ml-2 w-32 sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter and View Options Bar */}
        <div className="bg-teal-50 p-4 flex flex-wrap gap-3 items-center justify-between border-b border-teal-100">
          {/* Advanced Filter Options */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Dropdown */}
            <select 
              className="bg-white border border-teal-200 text-teal-700 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{t("filters.allCategories")}</option>
              <option value="plumbing">{t("services.categories.plumbing")}</option>
              <option value="electrical">{t("services.categories.electrical")}</option>
              <option value="gardening">{t("services.categories.gardening")}</option>
              {/* Add more categories as needed */}
            </select>
            
            {/* Location Filter */}
            <div className="flex items-center gap-1 bg-white border border-teal-200 text-teal-700 rounded-lg px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <select className="bg-transparent border-none text-sm focus:outline-none">
                <option value="">{t("filters.anyLocation")}</option>
                <option value="delhi">Delhi</option>
                <option value="mumbai">Mumbai</option>
                <option value="bangalore">Bangalore</option>
              </select>
            </div>
            
            {/* Price Range */}
            <div className="flex items-center gap-1 bg-white border border-teal-200 text-teal-700 rounded-lg px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v12M9 9h6M8 12h8M9 15h6"/>
              </svg>
              <select className="bg-transparent border-none text-sm focus:outline-none">
                <option value="">{t("filters.anyPrice")}</option>
                <option value="0-1000">₹0 - ₹1,000</option>
                <option value="1000-5000">₹1,000 - ₹5,000</option>
                <option value="5000-10000">₹5,000 - ₹10,000</option>
                <option value="10000+">₹10,000+</option>
              </select>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-teal-200 shadow-sm">
            <Button
              variant="ghost"
              size="sm" 
              onClick={() => setViewMode('list')}
              className={`rounded-md ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-teal-700'} transition-all duration-300 text-xs`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
              </svg>
              {t("services.listView")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('map')}
              className={`rounded-md ${viewMode === 'map' ? 'bg-teal-600 text-white' : 'text-teal-700'} transition-all duration-300 text-xs`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" x2="9" y1="3" y2="18"/>
                <line x1="15" x2="15" y1="6" y2="21"/>
              </svg>
              {t("services.mapView")}
            </Button>
          </div>
        </div>
        
        {/* Tabs Content Area - Hidden but still functioning */}
        <Tabs defaultValue="services" className="hidden">
          <TabsList className="hidden">
            <TabsTrigger value="services" data-tabs-trigger="services">
              {t("services.title")}
            </TabsTrigger>
            <TabsTrigger value="requirements" data-tabs-trigger="requirements">
              {t("requirements.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="block space-y-0">
            {/* This container will be displayed in the main content area */}
          </TabsContent>

          <TabsContent value="requirements" className="block space-y-0">
            {/* This container will be displayed in the main content area */}
          </TabsContent>
        </Tabs>
        
        {/* Main Content Area */}
        <div className="p-4 sm:p-6">
          {/* Services View - This will be controlled by the tab selected */}
          <div id="services-content" className={`transition-all duration-500 ${document.querySelector('[data-state="active"][data-tabs-trigger="services"]') ? 'block' : 'hidden'}`}>
            {viewMode === 'map' ? (
              <div className="rounded-xl overflow-hidden border border-teal-100 shadow-md h-[500px]">
                <ServiceMap 
                  services={services || []} 
                  onContactProvider={user ? handleContactProvider : undefined} 
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {services?.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onContact={user ? () => handleContactProvider(service) : undefined}
                  />
                ))}
                {(services?.length || 0) === 0 && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 text-center">
                    <div className="inline-flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-300 mb-3">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" x2="12" y1="8" y2="12"/>
                        <line x1="12" x2="12.01" y1="16" y2="16"/>
                      </svg>
                      <p className="text-teal-600 font-medium text-lg">{t("No services available at the moment")}</p>
                      <p className="text-teal-500 text-sm mt-1">{t("Check back later or post your own service")}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-teal-500 text-teal-600 hover:bg-teal-50"
                        onClick={() => navigate("/post-service")}
                      >
                        {t("Post a Service")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Requirements View */}
          <div id="requirements-content" className={`transition-all duration-500 ${document.querySelector('[data-state="active"][data-tabs-trigger="requirements"]') ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {requirements?.map((requirement) => (
                <RequirementCard
                  key={requirement.id}
                  requirement={requirement}
                  onSelect={user ? () => handleSelectRequirement(requirement) : undefined}
                />
              ))}
              {(requirements?.length || 0) === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 text-center">
                  <div className="inline-flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300 mb-3">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" x2="12" y1="8" y2="12"/>
                      <line x1="12" x2="12.01" y1="16" y2="16"/>
                    </svg>
                    <p className="text-emerald-600 font-medium text-lg">{t("No requirements available at the moment")}</p>
                    <p className="text-emerald-500 text-sm mt-1">{t("Check back later or post your own requirement")}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                      onClick={() => navigate("/post-requirement")}
                    >
                      {t("Post a Requirement")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pagination Footer */}
        <div className="bg-teal-50 p-4 border-t border-teal-100 flex justify-between items-center">
          <div className="text-sm text-teal-700">
            {services?.length ? `${services.length} ${t("results")}` : ""}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="px-2 py-1 text-xs border-teal-200 text-teal-700 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Button>
            <span className="text-sm bg-teal-600 text-white font-medium w-7 h-7 flex items-center justify-center rounded-md">1</span>
            <Button variant="outline" size="sm" className="px-2 py-1 text-xs border-teal-200 text-teal-700 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* JavaScript to handle tab toggling */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Initially show services content
            document.getElementById('services-content').style.display = 'block';
            document.getElementById('requirements-content').style.display = 'none';
            
            // Listen for tab clicks and update content visibility
            const servicesTab = document.querySelector('[data-tabs-trigger="services"]');
            const requirementsTab = document.querySelector('[data-tabs-trigger="requirements"]');
            
            if (servicesTab && requirementsTab) {
              // Create MutationObserver to watch for attribute changes
              const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation.attributeName === 'data-state') {
                    if (servicesTab.getAttribute('data-state') === 'active') {
                      document.getElementById('services-content').style.display = 'block';
                      document.getElementById('requirements-content').style.display = 'none';
                    } else {
                      document.getElementById('services-content').style.display = 'none';
                      document.getElementById('requirements-content').style.display = 'block';
                    }
                  }
                });
              });
              
              // Start observing the tab elements
              observer.observe(servicesTab, { attributes: true });
              observer.observe(requirementsTab, { attributes: true });
            }
          });
        `
      }} />
      
      {/* AI Chatbot */}
      <ChatbotUI />
    </div>
  );
}
