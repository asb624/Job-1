import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { forceLanguageChange } from "../lib/i18n";

export default function LanguageSelectionPage() {
  const [_, navigate] = useLocation();
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en");

  useEffect(() => {
    // Pre-select user's current language if it exists
    if (i18n.language) {
      setSelectedLanguage(i18n.language);
    }
  }, [i18n.language]);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" },
    { code: "ml", name: "മലയാളം (Malayalam)" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
    { code: "or", name: "ଓଡ଼ିଆ (Odia)" },
    { code: "as", name: "অসমীয়া (Assamese)" },
    { code: "kok", name: "कोंकणी (Konkani)" },
    { code: "ks", name: "کٲشُر (Kashmiri)" },
    { code: "sd", name: "سنڌي (Sindhi)" },
    { code: "mni", name: "মৈতৈলোন্ (Manipuri)" },
    { code: "brx", name: "बड़ो (Bodo)" }
  ];

  const handleContinue = async () => {
    try {
      console.log("Language selection - changing language to:", selectedLanguage);
      
      // Verify this is a new registration or incomplete onboarding flow
      const isNewRegistration = localStorage.getItem("isNewRegistration") === "true";
      const isInOnboardingFlow = sessionStorage.getItem("isInOnboardingFlow") === "true";
      
      console.log("Language selection - isNewRegistration:", isNewRegistration);
      console.log("Language selection - isInOnboardingFlow:", isInOnboardingFlow);
      
      if (!isNewRegistration && !isInOnboardingFlow) {
        console.log("Language selection - user is not in registration or onboarding flow, redirecting to home");
        navigate("/");
        return;
      }
      
      // Mark as being in the onboarding flow
      sessionStorage.setItem("isInOnboardingFlow", "true");
      
      // IMPORTANT: Store the selected language in localStorage for persistence
      // This is the canonical source of truth for language preference
      localStorage.setItem("preferredLanguage", selectedLanguage);
      
      // Use our utility function to forcefully change the language
      await forceLanguageChange(selectedLanguage);
      
      console.log("Language selection - language changed to:", i18n.language);
      console.log("Language selection - HTML lang attribute:", document.documentElement.lang);
      console.log("Language selection - stored in localStorage:", localStorage.getItem("preferredLanguage"));
      
      // Small delay to ensure language change takes effect
      setTimeout(() => {
        // Navigate to the onboarding page with our new language
        console.log("Language selection - navigating to onboarding page");
        // Make sure the onboarding flow flag is set
        sessionStorage.setItem("isInOnboardingFlow", "true");
        // Use a slightly longer timeout to ensure all state updates are processed
        navigate("/onboarding");
      }, 500);
    } catch (error) {
      console.error("Language selection - error changing language:", error);
      // Navigate anyway as this is non-critical
      sessionStorage.setItem("isInOnboardingFlow", "true");
      localStorage.setItem("preferredLanguage", selectedLanguage);
      console.log("Language selection - fallback navigation to onboarding page");
      // Use a timeout for navigation to ensure state updates are processed
      setTimeout(() => {
        navigate("/onboarding");
      }, 500);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Card className="shadow-lg border-teal-100">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white">
          <CardTitle className="text-2xl md:text-3xl font-bold">Choose Your Preferred Language</CardTitle>
          <CardDescription className="text-teal-50">
            Select the language you feel most comfortable using
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {languages.map((language) => (
              <div
                key={language.code}
                className={`
                  p-3 rounded-lg cursor-pointer border transition-all duration-200
                  ${selectedLanguage === language.code
                    ? "border-teal-500 bg-teal-50 shadow-sm"
                    : "border-gray-200 hover:border-teal-200 hover:bg-teal-50/30"
                  }
                `}
                onClick={() => setSelectedLanguage(language.code)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-4 h-4 rounded-full border ${
                      selectedLanguage === language.code 
                        ? "border-4 border-teal-500" 
                        : "border border-gray-300"
                    }`}
                  />
                  <span className={`${selectedLanguage === language.code ? "font-medium text-teal-800" : "text-gray-700"}`}>
                    {language.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleContinue}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}