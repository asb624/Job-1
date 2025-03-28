import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";
import { MapPin, Clock, Tag } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  onContact?: () => void;
}

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  return (
    <Card className="w-full relative overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border border-teal-100 group rounded-xl">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-emerald-400"></div>
      
      <CardHeader className="space-y-2 pt-6 pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
            {service.title}
          </h3>
          <span className="text-lg font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full shadow-sm border border-teal-100">
            ₹{service.price}
          </span>
        </div>
        <div className="flex items-center text-teal-600 gap-1.5">
          <Tag size={16} />
          <p className="text-sm">{service.category}</p>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 py-2">
        <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-teal-700">
          {service.city && (
            <div className="flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-full">
              <MapPin size={14} />
              <span>{service.city}{service.state ? `, ${service.state}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-full">
            <Clock size={14} />
            <span>{service.isRemote ? "Remote Available" : "In-person Only"}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 pt-2 pb-4">
        {onContact && (
          <Button 
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 
                     text-white font-medium shadow-sm hover:shadow-md transform transition-all duration-300 
                     hover:-translate-y-0.5 rounded-lg py-2" 
            onClick={onContact}
          >
            Contact Provider
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
