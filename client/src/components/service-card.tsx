import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";
import { MapPin, Clock, Tag, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ServiceCardProps {
  service: Service & { averageRating?: number };
  onContact?: () => void;
}

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card className="w-full relative overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border border-teal-100 group rounded-xl">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-emerald-400"></div>
      
      <CardHeader className="space-y-2 pt-6 pb-2 sm:pb-3 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-teal-800 group-hover:text-teal-600 transition-colors duration-300 line-clamp-2">
            {t(service.title)}
          </h3>
          <span className="text-base sm:text-lg font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full shadow-sm border border-teal-100 self-start whitespace-nowrap">
            ₹{service.price}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-teal-600 gap-1.5">
            <Tag size={16} />
            <p className="text-xs sm:text-sm">{t(service.category)}</p>
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
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">{t(service.description)}</p>
        
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 text-xs text-teal-700">
          {service.city && (
            <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-full">
              <MapPin size={12} className="sm:h-3.5 sm:w-3.5" />
              <span className="text-[10px] sm:text-xs">{service.city}{service.state ? `, ${service.state}` : ''}</span>
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
                     text-white font-medium shadow-sm hover:shadow-md transform transition-all duration-300 
                     hover:-translate-y-0.5 rounded-lg py-1.5 sm:py-2 text-sm" 
            onClick={onContact}
          >
            {t('services.contact')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
