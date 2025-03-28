import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Requirement } from "@shared/schema";

interface RequirementCardProps {
  requirement: Requirement;
  onSelect?: () => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  return (
    <Card className="w-full card relative overflow-hidden bg-white hover:bg-blue-50 border-blue-100">
      <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-50 to-blue-100 opacity-50 transform rotate-3 translate-y-[-2rem] z-0"></div>
      <CardHeader className="space-y-1 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-2xl font-bold text-primary">{requirement.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold bg-blue-100 px-2 py-1 rounded-md shadow-sm">₹{requirement.budget}</span>
            <span className={`capitalize px-2 py-1 text-sm rounded-full border shadow-sm 
              ${requirement.status === 'open' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-amber-100 text-amber-700 border-amber-200'}`}
            >
              {requirement.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{requirement.category}</p>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-sm text-gray-600">{requirement.description}</p>
      </CardContent>
      <CardFooter className="relative z-10 bg-gradient-to-r from-blue-50 to-white">
        {onSelect && requirement.status === "open" && (
          <Button className="w-full btn-transition bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md" onClick={onSelect}>
            Select
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
