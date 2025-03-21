import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  onContact?: () => void;
}

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">{service.title}</h3>
          <span className="text-xl font-semibold">${service.price}</span>
        </div>
        <p className="text-sm text-muted-foreground">{service.category}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{service.description}</p>
      </CardContent>
      <CardFooter>
        {onContact && (
          <Button className="w-full" onClick={onContact}>
            Contact Provider
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
