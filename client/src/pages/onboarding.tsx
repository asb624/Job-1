import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCircle, 
  Handshake as HandshakeIcon, 
  MapPin as MapPinIcon, 
  Languages as LanguagesIcon, 
  UserCheck, 
  Briefcase, 
  Star, 
  ArrowRight, 
  MessageSquare,
  Search,
  Megaphone,
  CheckCircle
} from "lucide-react";
import { forceLanguageChange } from "../lib/i18n";

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const [_, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Ensure user has selected a language before onboarding
  useEffect(() => {
    const preferredLanguage = localStorage.getItem("preferredLanguage");
    
    // Debug language selection
    console.log("Current i18n language:", i18n.language);
    console.log("Preferred language from localStorage:", preferredLanguage);
    
    if (!preferredLanguage) {
      // If no language is selected, redirect to language selection
      console.log("No preferred language found, redirecting to language selection");
      navigate("/language-selection");
      return;
    }
    
    // Check if the current language matches the preferred language
    if (i18n.language !== preferredLanguage) {
      console.log("Language mismatch, forcing language change");
      console.log("Current:", i18n.language, "Preferred:", preferredLanguage);
      
      // Apply language immediately from localStorage using our helper function
      const applyLanguage = async () => {
        try {
          console.log("Forcefully applying language:", preferredLanguage);
          
          // Force the language change with our utility
          await forceLanguageChange(preferredLanguage);
          
          // Verify the language change
          console.log("Language applied successfully:", i18n.language);
          console.log("HTML lang attribute:", document.documentElement.lang);
          
          // Force a re-render with the correct language
          setCurrentStep(prev => prev); // This triggers re-render
        } catch (error) {
          console.error("Error applying language:", error);
        }
      };
      
      // Apply language immediately on component mount
      applyLanguage();
    } else {
      console.log("Language already matches preferred language:", preferredLanguage);
    }
    
    // Force re-render with the correct language after a short delay
    // This helps ensure that even slow-loading translation resources are captured
    const timer = setTimeout(() => {
      // This will trigger a re-render with updated translations
      setCurrentStep(prev => prev);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [navigate, i18n]);
  
  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update onboarding status');
      }
      
      // Clear the onboarding flow flag since we're done
      sessionStorage.removeItem("isInOnboardingFlow");
      
      // Redirect to the home page
      navigate("/");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Clear the flag and redirect anyway, as this is non-critical
      sessionStorage.removeItem("isInOnboardingFlow");
      navigate("/");
    }
  };
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-teal-800 mb-4">
          {t("onboarding.Welcome to Job Bazaar")}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t("onboarding.Let's get you started with our platform in just a few simple steps")}
        </p>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-teal-700">
            {t("onboarding.Step")} {currentStep} {t("onboarding.of")} {totalSteps}
          </span>
          <span className="text-sm font-medium text-teal-700">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2 bg-teal-100 [&>div]:bg-teal-600" />
      </div>
      
      <div className="space-y-6">
        {currentStep === 1 && (
          <Card className="border-teal-100 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-4 md:p-6">
              <h2 className="text-2xl font-bold text-white">
                {t("onboarding.What brings you to Job Bazaar?")}
              </h2>
              <p className="text-teal-50 mt-2">
                {t("onboarding.Select your primary role to help us personalize your experience")}
              </p>
            </div>
            <CardContent className="p-6 space-y-6">
              <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-teal-50 rounded-xl border border-teal-100 p-1">
                  <TabsTrigger 
                    value="customer" 
                    className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-teal-700 rounded-lg transition-all duration-300"
                  >
                    <UserCircle className="mr-2 h-5 w-5" />
                    {t("onboarding.Looking for Services")}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="provider" 
                    className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-teal-700 rounded-lg transition-all duration-300"
                  >
                    <Briefcase className="mr-2 h-5 w-5" />
                    {t("onboarding.Offering Services")}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="customer" className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white rounded-xl p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-teal-200">
                      <Search className="h-10 w-10 text-teal-600 mb-3" />
                      <h3 className="text-lg font-medium text-teal-800 mb-2">{t("onboarding.Find Skilled Service Providers")}</h3>
                      <p className="text-gray-600 text-sm">
                        {t("onboarding.Browse through profiles of skilled professionals ready to help with your requirements")}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-teal-200">
                      <Megaphone className="h-10 w-10 text-teal-600 mb-3" />
                      <h3 className="text-lg font-medium text-teal-800 mb-2">{t("onboarding.Post Your Requirements")}</h3>
                      <p className="text-gray-600 text-sm">
                        {t("onboarding.Let service providers come to you by posting your specific service needs")}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="provider" className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-white rounded-xl p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-teal-200">
                      <Briefcase className="h-10 w-10 text-teal-600 mb-3" />
                      <h3 className="text-lg font-medium text-teal-800 mb-2">{t("onboarding.Showcase Your Services")}</h3>
                      <p className="text-gray-600 text-sm">
                        {t("onboarding.List your skills and services to attract potential clients in your area")}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-teal-100 hover:shadow-md transition-all duration-300 hover:border-teal-200">
                      <HandshakeIcon className="h-10 w-10 text-teal-600 mb-3" />
                      <h3 className="text-lg font-medium text-teal-800 mb-2">{t("onboarding.Apply for Requirements")}</h3>
                      <p className="text-gray-600 text-sm">
                        {t("onboarding.Browse open requirements and offer your services to clients in need")}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  {t("onboarding.Next")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep === 2 && (
          <Card className="border-teal-100 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-4 md:p-6">
              <h2 className="text-2xl font-bold text-white">
                {t("onboarding.Key Platform Features")}
              </h2>
              <p className="text-teal-50 mt-2">
                {t("onboarding.Discover what makes Job Bazaar special")}
              </p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex gap-4 p-4 rounded-lg border border-teal-100 bg-teal-50/40">
                  <div className="flex-shrink-0">
                    <div className="bg-teal-600 text-white p-3 rounded-full">
                      <LanguagesIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-teal-800 mb-1">{t("onboarding.Multilingual Support")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("onboarding.Communicate in your preferred language with support for 18 Indian languages")}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg border border-teal-100 bg-teal-50/40">
                  <div className="flex-shrink-0">
                    <div className="bg-teal-600 text-white p-3 rounded-full">
                      <MapPinIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-teal-800 mb-1">{t("onboarding.Location-Based Matching")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("onboarding.Find services and requirements in your vicinity easily with our map view")}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg border border-teal-100 bg-teal-50/40">
                  <div className="flex-shrink-0">
                    <div className="bg-teal-600 text-white p-3 rounded-full">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-teal-800 mb-1">{t("onboarding.Direct Messaging")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("onboarding.Connect and discuss details directly with service providers or clients")}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg border border-teal-100 bg-teal-50/40">
                  <div className="flex-shrink-0">
                    <div className="bg-teal-600 text-white p-3 rounded-full">
                      <Star className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-teal-800 mb-1">{t("onboarding.Ratings & Reviews")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("onboarding.Make informed decisions based on genuine ratings and reviews from other users")}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  {t("onboarding.Back")}
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  {t("onboarding.Next")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {currentStep === 3 && (
          <Card className="border-teal-100 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 p-4 md:p-6">
              <h2 className="text-2xl font-bold text-white">
                {t("onboarding.Ready to Get Started")}
              </h2>
              <p className="text-teal-50 mt-2">
                {t("onboarding.You're all set to begin your Job Bazaar journey")}
              </p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-teal-800 mb-2">
                  {t("onboarding.You're All Set!")}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {t("onboarding.Thank you for taking the time to learn about Job Bazaar. We're excited to have you join our community.")}
                </p>
                
                <div className="grid md:grid-cols-2 gap-3 max-w-md mx-auto">
                  <div className="text-left p-3 rounded-lg border border-teal-200 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-5 w-5 text-teal-600" />
                      <h4 className="font-medium text-teal-800">{t("onboarding.Browse Services")}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("onboarding.Explore available services in your area")}
                    </p>
                  </div>
                  <div className="text-left p-3 rounded-lg border border-teal-200 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Megaphone className="h-5 w-5 text-teal-600" />
                      <h4 className="font-medium text-teal-800">{t("onboarding.Post Requirement")}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("onboarding.Share your needs and find the right help")}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  {t("onboarding.Back")}
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  {t("onboarding.Get Started")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}