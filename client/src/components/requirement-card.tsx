import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Requirement } from "@shared/schema";
import { Calendar, MapPin, Tag, Clock } from "lucide-react";

interface RequirementCardProps {
  requirement: Requirement;
  onSelect?: () => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  return (
    <Card className="w-full relative overflow-hidden bg-white hover:shadow-lg transition-all duration-300 border border-emerald-100 group rounded-xl">
      {/* Left accent line */}
      <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-500 to-teal-600"></div>
      
      <CardHeader className="space-y-2 pl-6 pt-5 pb-3 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xl font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors duration-300">
            {requirement.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full shadow-sm border border-emerald-100">
              ₹{requirement.budget}
            </span>
            <span className={`capitalize px-3 py-1 text-sm rounded-full border shadow-sm flex items-center gap-1
              ${requirement.status === 'open' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'}`}
            >
              <span className={`w-2 h-2 rounded-full ${requirement.status === 'open' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {requirement.status}
            </span>
          </div>
        </div>
        <div className="flex items-center text-emerald-600 gap-1.5">
          <Tag size={16} />
          <p className="text-sm">{requirement.category}</p>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pl-6 py-2">
        <p className="text-sm text-gray-600 line-clamp-3">{requirement.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-emerald-700">
          {requirement.createdAt && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Calendar size={14} />
              <span>Posted: {new Date(requirement.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {requirement.city && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
              <MapPin size={14} />
              <span>{requirement.city}{requirement.state ? `, ${requirement.state}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Clock size={14} />
            <span>{requirement.isRemote ? "Remote Allowed" : "In-person Only"}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 pl-6 pt-2 pb-4">
        {onSelect && requirement.status === "open" && (
          <Button 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700
                     text-white font-medium shadow-sm hover:shadow-md transform transition-all duration-300 
                     hover:-translate-y-0.5 rounded-lg py-2" 
            onClick={onSelect}
          >
            Select
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
