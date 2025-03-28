import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  onContact?: () => void;
}

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  return (
    <Card className="w-full card bg-white hover:bg-blue-50">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary">{service.title}</h3>
          <span className="text-xl font-semibold bg-blue-100 px-2 py-1 rounded-md">₹{service.price}</span>
        </div>
        <p className="text-sm text-muted-foreground">{service.category}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{service.description}</p>
      </CardContent>
      <CardFooter>
        {onContact && (
          <Button className="w-full btn-transition bg-primary/90 hover:bg-primary" onClick={onContact}>
            Contact Provider
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
