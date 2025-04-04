import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { insertRequirementSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceCategories } from "@shared/schema";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";

// Default icon for the map marker
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationPicker({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default center of India

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (location) => {
          const newPos: [number, number] = [location.coords.latitude, location.coords.longitude];
          setPosition(newPos);
          setMapCenter(newPos);
          onChange(newPos[0], newPos[1]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [onChange]);

  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onChange(lat, lng);
      },
    });
    return null;
  }

  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden border">
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler />
        {position && <Marker position={position} icon={defaultIcon} />}
      </MapContainer>
    </div>
  );
}

export default function PostRequirement() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [showMap, setShowMap] = useState(false);
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(insertRequirementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budget: 0,
      isRemote: false,
      latitude: undefined,
      longitude: undefined,
      imageUrls: [],
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest<any>("POST", "/api/requirements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      toast({
        title: t('common.success'),
        description: t('postRequirement.successMessage', 'Your requirement has been posted successfully.'),
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('postRequirement.title', 'Post a Requirement')}</CardTitle>
        <CardDescription>
          {t('postRequirement.description', 'Describe what service you need and set your budget')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createRequirementMutation.mutate(data))}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postRequirement.titleLabel', 'Title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('postRequirement.titlePlaceholder', 'E.g. Need a Housemaid for Cleaning')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postRequirement.descriptionLabel', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('postRequirement.descriptionPlaceholder', 'Provide detailed requirements...')}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fileUpload.images')}</FormLabel>
                  <FormControl>
                    <FileUpload
                      onFilesSelected={(urls) => {
                        field.onChange(urls);
                      }}
                      initialFiles={field.value}
                      label={t('fileUpload.addImages')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postRequirement.categoryLabel', 'Category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('postRequirement.categoryPlaceholder', 'Select a category')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`services.categories.${category.toLowerCase().replace(/\s+/g, '')}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postRequirement.budgetLabel', 'Budget')} (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('postRequirement.budgetPlaceholder', 'Enter your budget')}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRemote"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('services.remote')}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t('postRequirement.isRemote', 'This requirement can be fulfilled remotely')}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {!form.watch("isRemote") && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2 items-center">
                    <FormLabel>{t('postRequirement.location', 'Location')}</FormLabel>
                    <span className="text-destructive ml-1">*</span>
                    <span className="text-sm text-muted-foreground ml-2">(Required)</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        if ('geolocation' in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude, longitude } = position.coords;
                              form.setValue("latitude", latitude as any);
                              form.setValue("longitude", longitude as any);
                              setShowMap(true);
                            },
                            (error) => {
                              console.error("Error getting location:", error);
                              toast({
                                title: t('common.error'),
                                description: "Could not get your location. Please allow location access or enter coordinates manually.",
                                variant: "destructive",
                              });
                            }
                          );
                        } else {
                          toast({
                            title: t('common.error'),
                            description: "Geolocation is not supported by your browser",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      {t('postRequirement.useMyLocation', 'Use My Location')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowMap(!showMap)}
                    >
                      {showMap ? t('common.close') : t('postRequirement.pickLocation', 'Pick on Map')}
                    </Button>
                  </div>
                </div>
                
                {showMap && (
                  <LocationPicker 
                    onChange={(lat, lng) => {
                      form.setValue("latitude", lat as any);
                      form.setValue("longitude", lng as any);
                    }} 
                  />
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postRequirement.latitude', 'Latitude')}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={showMap} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postRequirement.longitude', 'Longitude')}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={showMap} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={createRequirementMutation.isPending}
            >
              {t('postRequirement.submit', 'Post Requirement')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
