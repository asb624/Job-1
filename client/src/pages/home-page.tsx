import { useQuery, useMutation } from "@tanstack/react-query";
import { Service as BaseService, Requirement as BaseRequirement } from "@shared/schema";

// Extended types to include distance information
interface Service extends BaseService {
  distance?: number;
  distanceLabel?: string;
}

interface Requirement extends BaseRequirement {
  distance?: number;
  distanceLabel?: string;
}
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
import { LocationSearch } from "@/components/location-search";
import { useTranslation } from "react-i18next";
import { preloadTranslations } from "@/lib/translation-utils";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeTab, setActiveTab] = useState<'services' | 'requirements'>('services');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<{
    displayName: string;
    lat: number;
    lon: number;
    radius: number;
  } | null>(null);
  const { t, i18n } = useTranslation();

  // Queries for services based on location filter
  // Helper function to filter by search query
  const filterBySearchQuery = <T extends { title?: string; description?: string; city?: string; category?: string; }>(
    items: T[] | undefined,
    query: string
  ): T[] => {
    if (!items) return [];
    if (!query) return items;
    
    return items.filter(item => 
      (item.title && item.title.toLowerCase().includes(query.toLowerCase())) || 
      (item.description && item.description.toLowerCase().includes(query.toLowerCase())) || 
      (item.city && item.city.toLowerCase().includes(query.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(query.toLowerCase()))
    );
  };
  
  const { data: services, isSuccess: servicesLoaded, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", locationFilter],
    queryFn: async () => {
      if (locationFilter) {
        // Use location-based API endpoint when filter is active
        const response = await fetch(
          `/api/services?lat=${locationFilter.lat}&lng=${locationFilter.lon}&radius=${locationFilter.radius}&isRemote=true`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch location filtered services');
        }
        return response.json();
      } else {
        // Default API endpoint when no location filter
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        return response.json();
      }
    }
  });

  const { data: requirements, isSuccess: requirementsLoaded, isLoading: requirementsLoading } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements", locationFilter],
    queryFn: async () => {
      if (locationFilter) {
        // Use location-based API endpoint when filter is active
        const response = await fetch(
          `/api/requirements?lat=${locationFilter.lat}&lng=${locationFilter.lon}&radius=${locationFilter.radius}&isRemote=true`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch location filtered requirements');
        }
        return response.json();
      } else {
        // Default API endpoint when no location filter
        const response = await fetch('/api/requirements');
        if (!response.ok) {
          throw new Error('Failed to fetch requirements');
        }
        return response.json();
      }
    }
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
      return apiRequest<{ id: number }>("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipientId: providerId })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversation created",
        description: "You can now start messaging this user",
      });
      // Navigate to the specific conversation if available
      if (data && data.id) {
        navigate(`/messages?conversation=${data.id}`);
      } else {
        navigate("/messages");
      }
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

  // Handler for selecting a requirement and opening a conversation with the user
  const handleSelectRequirement = (requirement: Requirement) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to login to contact this user",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // Create conversation with the requirement creator
    createConversationMutation.mutate(requirement.userId);
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
          
          {/* Location Search Bar - Using special container with highest z-index */}
          <div className="relative mx-auto mt-4" style={{ zIndex: 9999, maxWidth: "28rem" }}>
            <LocationSearch 
              onLocationSelect={(location) => {
                console.log("Selected location on hero:", location);
                // Set location filter with 10km radius
                setLocationFilter({
                  ...location,
                  radius: 10 // 10km radius around the selected location
                });
                toast({
                  title: t("location.filterApplied"),
                  description: t("location.showing10km", "Showing services within 10km of {{location}}", { location: location.displayName }),
                  duration: 4000,
                });
              }}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg shadow-lg"
              placeholder={t("filters.searchLocation")}
            />
          </div>
          
          {/* Post Buttons */}
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/post-service")}
            >
              <div className="flex items-center gap-2">
                <span className="bg-teal-600 text-white p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </span>
                {t("navigation.postService")}
              </div>
            </Button>
            
            <Button 
              className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/post-requirement")}
            >
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </span>
                {t("navigation.postRequirement")}
              </div>
            </Button>
          </div>
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
              
              {/* Buttons moved to hero section */}
            </div>
            
            {/* Enhanced Tab Navigation - Custom Design */}
            <div className="mt-6 flex items-center">
              <div className="flex bg-white/20 p-1 rounded-xl">
                <button
                  onClick={() => {
                    // Set active tab to services
                    setActiveTab('services');
                    
                    // Also trigger the shadcn Tabs component for consistency
                    const servicesTab = document.querySelector('[data-tabs-trigger="services"]') as HTMLButtonElement;
                    if (servicesTab) servicesTab.click();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                    activeTab === 'services'
                      ? 'bg-white text-teal-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t("services.title")}
                </button>
                <button
                  onClick={() => {
                    // Set active tab to requirements
                    setActiveTab('requirements');
                    
                    // Also trigger the shadcn Tabs component for consistency
                    const requirementsTab = document.querySelector('[data-tabs-trigger="requirements"]') as HTMLButtonElement;
                    if (requirementsTab) requirementsTab.click();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                    activeTab === 'requirements'
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
            
            {/* Location Filter Indicator */}
            {locationFilter && (
              <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px]">
                  {locationFilter.displayName}
                </span>
                <button 
                  className="ml-1 text-emerald-700 hover:text-emerald-900"
                  onClick={() => {
                    setLocationFilter(null);
                    toast({
                      title: t("location.filterRemoved"),
                      description: t("location.showingAll"),
                      duration: 3000,
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            )}
            
            {/* Price Range Filter - To be implemented */}
            <select 
              className="bg-white border border-teal-200 text-teal-700 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{t("filters.priceRange")}</option>
              <option value="0-1000">₹0 - ₹1,000</option>
              <option value="1000-5000">₹1,000 - ₹5,000</option>
              <option value="5000-10000">₹5,000 - ₹10,000</option>
              <option value="10000+">{t("filters.above")} ₹10,000</option>
            </select>
          </div>
          
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-teal-100 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-teal-700 hover:bg-teal-50'}`}
              title={t("services.listView", "List View")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-white shadow-sm' : 'text-teal-700 hover:bg-teal-50'}`}
              title={t("services.mapView", "Map View")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search Bar for Services/Requirements */}
        <div className="bg-white border-b border-teal-100 py-3 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder={t(activeTab === 'services' ? "services.search_placeholder" : "requirements.search_placeholder", "Search for " + (activeTab === 'services' ? "services" : "requirements") + "...")}
                className="w-full bg-teal-50 border border-teal-200 text-teal-800 text-sm rounded-lg pl-10 p-2.5 focus:ring-teal-500 focus:border-teal-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-teal-600 hover:text-teal-800"
                  onClick={() => setSearchQuery('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="p-4 sm:p-6">
          {/* Services View - This will be controlled by the tab state */}
          <div id="services-content" className={`transition-all duration-500 ${activeTab === 'services' ? 'block' : 'hidden'}`}>
            {viewMode === 'map' ? (
              <div className="rounded-xl overflow-hidden border border-teal-100 shadow-md h-[500px]">
                <ServiceMap 
                  services={services || []} 
                  onContactProvider={user ? handleContactProvider : undefined} 
                />
              </div>
            ) : (
              <div>
                {/* Show loading indicator while location filter is being applied */}
                {servicesLoading && locationFilter && (
                  <div className="flex items-center justify-center p-10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="text-emerald-700 font-medium">{t("location.loadingServices")}</p>
                    </div>
                  </div>
                )}
                
                {!servicesLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filterBySearchQuery(services, searchQuery).map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={{
                          ...service,
                          // Add distance label if available in service object
                          distanceLabel: 'distance' in service && typeof service.distance === 'number'
                            ? service.distance < 1
                              ? t('location.meters_away', { distance: Math.round(service.distance * 1000) })
                              : t('location.kilometers_away', { distance: service.distance.toFixed(1) })
                            : undefined
                        }}
                        onContact={user ? () => handleContactProvider(service) : undefined}
                      />
                    ))}
                    {(filterBySearchQuery(services, searchQuery).length === 0) && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-300 mb-3">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" x2="12" y1="8" y2="12"/>
                            <line x1="12" x2="12.01" y1="16" y2="16"/>
                          </svg>
                          <p className="text-teal-600 font-medium text-lg">
                            {searchQuery 
                              ? t("marketplace.no_search_results", "No services matching '{{query}}'", {query: searchQuery})
                              : t("marketplace.no_services")
                            }
                          </p>
                          <p className="text-teal-500 text-sm mt-1">
                            {searchQuery 
                              ? t("marketplace.try_different_search", "Try a different search term or check back later")
                              : t("marketplace.check_back_service")
                            }
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4 border-teal-500 text-teal-600 hover:bg-teal-50"
                            onClick={() => navigate("/post-service")}
                          >
                            {t("navigation.postService")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Requirements View */}
          <div id="requirements-content" className={`transition-all duration-500 ${activeTab === 'requirements' ? 'block' : 'hidden'}`}>
            {/* Show loading indicator while location filter is being applied */}
            {requirementsLoading && locationFilter && (
              <div className="flex items-center justify-center p-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <p className="text-emerald-700 font-medium">{t("location.loadingRequirements")}</p>
                </div>
              </div>
            )}
            
            {!requirementsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filterBySearchQuery(requirements, searchQuery).map((requirement) => (
                  <RequirementCard
                    key={requirement.id}
                    requirement={{
                      ...requirement,
                      // Add distance label if available in requirement object
                      distanceLabel: 'distance' in requirement && typeof requirement.distance === 'number'
                        ? requirement.distance < 1
                          ? t('location.meters_away', { distance: Math.round(requirement.distance * 1000) })
                          : t('location.kilometers_away', { distance: requirement.distance.toFixed(1) })
                        : undefined
                    }}
                    onSelect={user ? () => handleSelectRequirement(requirement) : undefined}
                  />
                ))}
                {(filterBySearchQuery(requirements, searchQuery).length === 0) && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 text-center">
                    <div className="inline-flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300 mb-3">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" x2="12" y1="8" y2="12"/>
                        <line x1="12" x2="12.01" y1="16" y2="16"/>
                      </svg>
                      <p className="text-emerald-600 font-medium text-lg">
                        {searchQuery 
                          ? t("marketplace.no_search_results_req", "No requirements matching '{{query}}'", {query: searchQuery})
                          : t("marketplace.no_requirements")
                        }
                      </p>
                      <p className="text-emerald-500 text-sm mt-1">
                        {searchQuery 
                          ? t("marketplace.try_different_search", "Try a different search term or check back later")
                          : t("marketplace.check_back_requirement")
                        }
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => navigate("/post-requirement")}
                      >
                        {t("navigation.postRequirement")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Pagination Footer */}
        <div className="bg-teal-50 p-4 border-t border-teal-100 flex justify-between items-center">
          <div className="text-sm text-teal-700">
            {services ? 
              `${filterBySearchQuery(services, searchQuery).length} ${t("marketplace.results")}` 
              : ""
            }
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
      
      {/* AI Chatbot */}
      <ChatbotUI />
    </div>
  );
}