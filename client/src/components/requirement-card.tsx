import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Requirement } from "@shared/schema";
import { Calendar, MapPin, Tag, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RequirementCardProps {
  requirement: Requirement;
  onSelect?: () => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card className="w-full relative overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border border-emerald-100 group rounded-xl">
      {/* Left accent line */}
      <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 to-teal-600"></div>
      
      <CardHeader className="space-y-2 pl-4 sm:pl-6 pt-4 sm:pt-5 pb-2 sm:pb-3 relative z-10 pr-4 sm:pr-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors duration-300 line-clamp-2">
            {requirement.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap self-start">
            <span className="text-base sm:text-lg font-semibold text-emerald-700 bg-emerald-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm border border-emerald-100 whitespace-nowrap">
              ₹{requirement.budget}
            </span>
            <span className={`capitalize px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full border shadow-sm flex items-center gap-1
              ${requirement.status === 'open' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'}`}
            >
              <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${requirement.status === 'open' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {t(`requirements.${requirement.status}`, requirement.status)}
            </span>
          </div>
        </div>
        <div className="flex items-center text-emerald-600 gap-1.5">
          <Tag size={14} className="sm:h-4 sm:w-4" />
          <p className="text-xs sm:text-sm">{requirement.category}</p>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pl-4 sm:pl-6 py-1 sm:py-2 pr-4 sm:pr-6">
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">{requirement.description}</p>
        
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-emerald-700">
          {requirement.createdAt && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              <Calendar size={12} className="sm:h-3.5 sm:w-3.5" />
              <span>{t('requirements.posted', 'Posted')}: {new Date(requirement.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {requirement.city && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              <MapPin size={12} className="sm:h-3.5 sm:w-3.5" />
              <span>{requirement.city}{requirement.state ? `, ${requirement.state}` : ''}</span>
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
        {onSelect && requirement.status === "open" && (
          <Button 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700
                     text-white font-medium shadow-sm hover:shadow-md transform transition-all duration-300 
                     hover:-translate-y-0.5 rounded-lg py-1.5 sm:py-2 text-sm" 
            onClick={onSelect}
          >
            {t('requirements.bid', 'Select')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
