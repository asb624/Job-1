import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  onContact?: () => void;
}

export function ServiceCard({ service, onContact }: ServiceCardProps) {
  return (
    <Card className="w-full card relative overflow-hidden bg-white hover:bg-blue-50 border-blue-100">
      <div className="absolute top-0 right-0 w-full h-16 bg-gradient-to-r from-blue-100 to-blue-50 opacity-50 transform -rotate-3 translate-y-[-2rem] z-0"></div>
      <CardHeader className="space-y-1 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary">{service.title}</h3>
          <span className="text-xl font-semibold bg-blue-100 px-2 py-1 rounded-md shadow-sm">₹{service.price}</span>
        </div>
        <p className="text-sm text-muted-foreground">{service.category}</p>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-sm text-gray-600">{service.description}</p>
      </CardContent>
      <CardFooter className="relative z-10 bg-gradient-to-r from-white to-blue-50">
        {onContact && (
          <Button className="w-full btn-transition bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md" onClick={onContact}>
            Contact Provider
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
