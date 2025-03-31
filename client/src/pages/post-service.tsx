import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { insertServiceSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceCategories } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from "react-i18next";
import { LocationSearch } from "@/components/location-search";
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

export default function PostService() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [showMap, setShowMap] = useState(false);
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: 0,
      isRemote: false,
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      latitude: undefined,
      longitude: undefined,
      serviceRadius: 5, // Default 5km radius
      imageUrls: [],
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/services", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: t('common.success'),
        description: t('postService.submit') + " " + t('common.success').toLowerCase(),
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
        <CardTitle>{t('postService.title')}</CardTitle>
        <CardDescription>
          {t('postService.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createServiceMutation.mutate(data))}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postService.serviceTitle')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('postService.titlePlaceholder')} {...field} />
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
                  <FormLabel>{t('postService.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('postService.descriptionPlaceholder')}
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
                  <FormLabel>{t('postService.category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('postService.categoryPlaceholder')} />
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postService.price')} (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('postService.pricePlaceholder')}
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
                      {t('postService.isRemote')}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {!form.watch("isRemote") && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postService.address')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('postService.addressPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postService.city')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('postService.cityPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postService.state')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('postService.statePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postService.country')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('postService.countryPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('postService.postalCode')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('postService.postalCodePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serviceRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('postService.serviceRadius')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder={t('postService.serviceRadiusPlaceholder')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel>{t('postService.location')}</FormLabel>
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
                        {t('postService.useMyLocation', 'Use My Location')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowMap(!showMap)}
                      >
                        {showMap ? t('common.close') : t('postService.pickLocation')}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Nominatim Location Search */}
                  <div className="w-full">
                    <FormLabel className="mb-2 block">{t('filters.searchLocation')}</FormLabel>
                    <LocationSearch 
                      onLocationSelect={(location) => {
                        console.log("Selected location:", location);
                        // Update the form fields with the selected location details
                        form.setValue("latitude", location.lat as any);
                        form.setValue("longitude", location.lon as any);
                        
                        // Try to extract city, state and country from the display name
                        // Display name format is typically: "Street, City, Region, Country, Postal Code"
                        const addressParts = location.displayName.split(',').map(part => part.trim());
                        
                        if (addressParts.length >= 3) {
                          // Assuming city is near the beginning, country near the end
                          const cityIndex = 1; // Often the second element
                          const stateIndex = Math.max(0, addressParts.length - 3);
                          const countryIndex = Math.max(0, addressParts.length - 2);
                          
                          form.setValue("city", addressParts[cityIndex] || "");
                          form.setValue("state", addressParts[stateIndex] || "");
                          form.setValue("country", addressParts[countryIndex] || "");
                          
                          // For address, use the first part or combination
                          form.setValue("address", addressParts[0] || "");
                          
                          // For postal code (if available), often the last part
                          const postalCodeCandidate = addressParts[addressParts.length - 1];
                          if (postalCodeCandidate && /\d/.test(postalCodeCandidate)) {
                            form.setValue("postalCode", postalCodeCandidate);
                          }
                        }
                        
                        setShowMap(true);
                      }}
                      className="w-full"
                      placeholder={t('postService.searchLocationPlaceholder')}
                    />
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
                          <FormLabel>{t('postService.latitude')}</FormLabel>
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
                          <FormLabel>{t('postService.longitude')}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={showMap} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={createServiceMutation.isPending}
            >
              {t('postService.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
