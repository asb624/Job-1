import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Requirement } from "@shared/schema";

interface RequirementCardProps {
  requirement: Requirement;
  onSelect?: () => void;
}

export function RequirementCard({ requirement, onSelect }: RequirementCardProps) {
  return (
    <Card className="w-full card bg-white hover:bg-blue-50">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary">{requirement.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold bg-blue-100 px-2 py-1 rounded-md">₹{requirement.budget}</span>
            <span className="capitalize px-2 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
              {requirement.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{requirement.category}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{requirement.description}</p>
      </CardContent>
      <CardFooter>
        {onSelect && requirement.status === "open" && (
          <Button className="w-full btn-transition bg-primary/90 hover:bg-primary" onClick={onSelect}>
            Select
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
