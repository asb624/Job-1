import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";
import { MapPin, Clock, Tag, Star, Calendar, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { useTranslatedContent } from "@/lib/translation-utils";

interface ServiceCardProps {
  service: Service & { averageRating?: number };
  onContact?: () => void;
}

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  const { t, i18n } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTranslating, setIsTranslating] = useState(i18n.language !== 'en');
  const hasImages = service.imageUrls && Array.isArray(service.imageUrls) && service.imageUrls.length > 0;
  
  // Use our custom hook to handle translations with async support
  const translatedTitle = useTranslatedContent(service.title, i18n.language);
  const translatedDescription = useTranslatedContent(service.description, i18n.language);
  const translatedCity = useTranslatedContent(service.city, i18n.language);
  const translatedState = useTranslatedContent(service.state, i18n.language);
  
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
      (service.title === translatedTitle || translatedTitle !== service.title) &&
      (service.description === translatedDescription || translatedDescription !== service.description) &&
      (!service.city || service.city === translatedCity || translatedCity !== service.city) &&
      (!service.state || service.state === translatedState || translatedState !== service.state);
    
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
    service.title, 
    service.description, 
    service.city, 
    service.state
  ]);
  
  return (
    <Card className="w-full relative overflow-hidden bg-white hover:shadow-lg transition-all duration-400 ease-in-out border border-teal-100 group rounded-xl transform hover:-translate-y-1 animate-in fade-in-5 slide-in-from-bottom-5 duration-700">
      {/* Translation loading overlay */}
      {isTranslating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
            <span className="text-sm font-medium text-teal-700">{t('common.translating', 'Translating...')}</span>
          </div>
        </div>
      )}
      
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-emerald-400"></div>
      
      {/* Image Gallery */}
      {hasImages && (
        <div className="relative w-full h-48 overflow-hidden">
          <img 
            src={service.imageUrls![currentImageIndex]} 
            alt={service.title}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Image Navigation */}
          {service.imageUrls!.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {service.imageUrls!.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentImageIndex ? 'bg-white' : 'bg-white/60 hover:bg-white/80'
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
      
      <CardHeader className="space-y-2 pt-6 pb-2 sm:pb-3 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-teal-800 group-hover:text-teal-600 transition-colors duration-300 ease-in-out line-clamp-2">
            {translatedTitle}
          </h3>
          <span className="text-base sm:text-lg font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full shadow-sm border border-teal-100 self-start whitespace-nowrap">
            ₹{service.price}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-teal-600 gap-1.5">
            <Tag size={16} />
            <p className="text-xs sm:text-sm">{t(`services.categories.${service.category.toLowerCase().replace(/\s+/g, '')}`, service.category)}</p>
          </div>
          {service.averageRating != null && service.averageRating > 0 && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-amber-500" />
              <span className="text-xs font-medium">{service.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0 pb-2 px-4 sm:px-6">
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">{translatedDescription}</p>
        
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 text-xs text-teal-700">
          {service.createdAt && (
            <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full">
              <Calendar size={12} className="sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] sm:text-xs">{t('services.posted', 'Posted')}: {formatDate(service.createdAt)}</span>
            </div>
          )}
          {service.city && (
            <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full">
              <MapPin size={12} className="sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] sm:text-xs">{translatedCity}{translatedState ? `, ${translatedState}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full">
            <Clock size={12} className="sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">
              {service.isRemote ? t('services.remote') : t('services.inPersonOnly', 'In-person Only')}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 pt-2 pb-4 px-4 sm:px-6">
        {onContact && (
          <Button 
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 
                     text-white font-medium shadow-sm hover:shadow-md transform transition-all duration-400 ease-in-out 
                     hover:-translate-y-1 hover:scale-105 rounded-lg py-1.5 sm:py-2 text-sm" 
            onClick={onContact}
          >
            {t('services.contact')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
