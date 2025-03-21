import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Requirement } from "@shared/schema";

interface RequirementCardProps {
  requirement: Requirement;
  onBid?: () => void;
}

export function RequirementCard({ requirement, onBid }: RequirementCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">{requirement.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">${requirement.budget}</span>
            <span className="capitalize px-2 py-1 text-sm rounded-full bg-primary/10 text-primary">
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
        {onBid && requirement.status === "open" && (
          <Button className="w-full" onClick={onBid}>
            Place Bid
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
