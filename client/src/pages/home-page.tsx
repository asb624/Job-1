import { useQuery } from "@tanstack/react-query";
import { Service, Requirement } from "@shared/schema";
import { ServiceCard } from "@/components/service-card";
import { RequirementCard } from "@/components/requirement-card";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { user } = useAuth();

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: requirements } = useQuery<Requirement[]>({
    queryKey: ["/api/requirements"],
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to ServiceMarket</h1>
        <p className="text-xl text-muted-foreground">
          Connect with skilled professionals or find your next project
        </p>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="services">Available Services</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services?.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onContact={user ? () => {} : undefined}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requirements">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requirements?.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                onBid={user?.isServiceProvider ? () => {} : undefined}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
