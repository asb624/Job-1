import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Requirement } from "@shared/schema";
import { Calendar, MapPin, Tag, Clock, Image, Loader2, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { useTranslatedContent } from "@/lib/translation-utils";
import { speechService } from "@/lib/speech-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RequirementCardProps {
  requirement: Requirement;
  onSelect?: () => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTranslating, setIsTranslating] = useState(i18n.language !== 'en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasImages = requirement.imageUrls && Array.isArray(requirement.imageUrls) && requirement.imageUrls.length > 0;
  const isSpeechSupported = speechService.isSupported();
  
  // Use our custom hook to handle translations with async support
  const translatedTitle = useTranslatedContent(requirement.title, i18n.language);
  const translatedDescription = useTranslatedContent(requirement.description, i18n.language);
  const translatedCity = useTranslatedContent(requirement.city, i18n.language);
  const translatedState = useTranslatedContent(requirement.state, i18n.language);
  
  // Track translation state to show loading animation
  useEffect(() => {
    if (i18n.language === 'en') {
      // No translation needed for English
      setIsTranslating(false);
      return;
    }
    
    // Initial state - assume we're translating
    setIsTranslating(true);
    
    // Check if translations are complete
    const isComplete = 
      (requirement.title === translatedTitle || translatedTitle !== requirement.title) &&
      (requirement.description === translatedDescription || translatedDescription !== requirement.description) &&
      (!requirement.city || requirement.city === translatedCity || translatedCity !== requirement.city) &&
      (!requirement.state || requirement.state === translatedState || translatedState !== requirement.state);
    
    if (isComplete) {
      // Add a small delay for smooth transition
      const timer = setTimeout(() => {
        setIsTranslating(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [
    i18n.language, 
    translatedTitle, 
    translatedDescription, 
    translatedCity, 
    translatedState, 
    requirement.title, 
    requirement.description, 
    requirement.city, 
    requirement.state
  ]);
  
  return (
    <Card className="w-full relative overflow-hidden bg-white hover:shadow-lg transition-all duration-400 ease-in-out border border-emerald-100 group rounded-xl transform hover:-translate-y-1 animate-in fade-in-5 slide-in-from-bottom-5 duration-700">
      {/* Translation loading overlay */}
      {isTranslating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <span className="text-sm font-medium text-emerald-700">{t('common.translating', 'Translating...')}</span>
          </div>
        </div>
      )}
      
      {/* Left accent line */}
      <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 to-teal-600"></div>
      
      {/* Image Gallery */}
      {hasImages && (
        <div className="relative w-full h-48 overflow-hidden ml-2">
          <img 
            src={requirement.imageUrls![currentImageIndex]} 
            alt={requirement.title}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Image Navigation */}
          {requirement.imageUrls!.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {requirement.imageUrls!.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentImageIndex ? 'bg-emerald-500' : 'bg-emerald-200 hover:bg-emerald-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="space-y-2 pl-4 sm:pl-6 pt-4 sm:pt-5 pb-2 sm:pb-3 relative z-10 pr-4 sm:pr-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors duration-300 ease-in-out line-clamp-2">
              {translatedTitle}
            </h3>
            
            {/* Pronunciation button */}
            {isSpeechSupported && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
                        isSpeaking 
                          ? 'bg-emerald-100 text-emerald-600 animate-pulse' 
                          : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        
                        if (isSpeaking) {
                          // Stop speaking if already in progress
                          speechService.stop();
                          setIsSpeaking(false);
                        } else {
                          // Start speech
                          setIsSpeaking(true);
                          const textToRead = translatedTitle;
                          
                          speechService.speak(textToRead, i18n.language)
                            .then(() => {
                              setIsSpeaking(false);
                            })
                            .catch((error) => {
                              console.error('Speech error:', error);
                              setIsSpeaking(false);
                            });
                        }
                      }}
                    >
                      {isSpeaking ? (
                        <VolumeX size={16} className="sm:w-5 sm:h-5" />
                      ) : (
                        <Volume2 size={16} className="sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isSpeaking ? t('common.stopPronunciation', 'Stop') : t('common.pronounce', 'Pronounce')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start">
            <span className="text-base sm:text-lg font-semibold text-emerald-700 bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm border border-emerald-100 whitespace-nowrap">
              ₹{requirement.budget}
            </span>
            <span className={`capitalize px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full border shadow-sm flex items-center gap-1
              ${(requirement.status === 'open' || requirement.status === 'active')
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'}`}
            >
              <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${(requirement.status === 'open' || requirement.status === 'active') ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {requirement.status === 'active' ? t('requirements.open', 'Open') : t(`requirements.${requirement.status}`, requirement.status)}
            </span>
          </div>
        </div>
        <div className="flex items-center text-emerald-600 gap-1.5">
          <Tag size={14} className="sm:h-4 sm:w-4" />
          <p className="text-xs sm:text-sm">{t(`services.categories.${requirement.category.toLowerCase().replace(/\s+/g, '')}`, requirement.category)}</p>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pl-4 sm:pl-6 py-1 sm:py-2 pr-4 sm:pr-6">
        <div className="flex items-start gap-2">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 flex-1">{translatedDescription}</p>
          
          {/* Description pronunciation button */}
          {isSpeechSupported && (
            <button 
              className={`flex-none mt-0.5 rounded-full p-1 transition-colors ${
                isSpeaking 
                  ? 'bg-emerald-100 text-emerald-600 animate-pulse' 
                  : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (isSpeaking) {
                  // Stop speaking if already in progress
                  speechService.stop();
                  setIsSpeaking(false);
                } else {
                  // Start speech
                  setIsSpeaking(true);
                  const textToRead = translatedDescription;
                  
                  speechService.speak(textToRead, i18n.language)
                    .then(() => {
                      setIsSpeaking(false);
                    })
                    .catch((error) => {
                      console.error('Speech error:', error);
                      setIsSpeaking(false);
                    });
                }
              }}
              title={isSpeaking ? t('common.stopPronunciation', 'Stop') : t('common.pronounceDescription', 'Pronounce description')}
            >
              {isSpeaking ? (
                <VolumeX size={14} className="sm:w-4 sm:h-4" />
              ) : (
                <Volume2 size={14} className="sm:w-4 sm:h-4" />
              )}
            </button>
          )}
        </div>
        
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-emerald-700">
          {requirement.createdAt && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              <Calendar size={12} className="sm:h-3.5 sm:w-3.5" />
              <span>{t('requirements.posted', 'Posted')}: {formatDate(requirement.createdAt)}</span>
            </div>
          )}
          {requirement.city && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              <MapPin size={12} className="sm:h-3.5 sm:w-3.5" />
              <span>{translatedCity}{translatedState ? `, ${translatedState}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
            <Clock size={12} className="sm:h-3.5 sm:w-3.5" />
            <span>
              {requirement.isRemote 
                ? t('requirements.remoteAllowed', 'Remote Allowed') 
                : t('services.inPersonOnly', 'In-person Only')}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 pl-4 sm:pl-6 pt-2 pb-4 pr-4 sm:pr-6">
        {onSelect && (requirement.status === "open" || requirement.status === "active") && (
          <Button 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700
                     text-white font-medium shadow-sm hover:shadow-md transform transition-all duration-400 ease-in-out 
                     hover:-translate-y-1 hover:scale-105 rounded-lg py-1.5 sm:py-2 text-sm" 
            onClick={onSelect}
          >
            {t('requirements.bid', 'Contact')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
