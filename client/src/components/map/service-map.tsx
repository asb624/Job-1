import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Service } from '@shared/schema';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useLocation } from 'wouter';

// Fix for default icon issue in Leaflet with webpack/vite
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ServiceMapProps {
  services: Service[];
  onContactProvider?: (service: Service) => void;
}

// Component to update map when center changes
function MapSetter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  
  return null;
}

// Component to fit bounds to show all markers
function MapBoundsSetter({ 
  services, 
  userLocation 
}: { 
  services: Service[], 
  userLocation: [number, number] | null 
}) {
  const map = useMap();
  
  useEffect(() => {
    if (services.length === 0) return;
    
    // Get all valid coordinates including user location
    const coordinates: [number, number][] = services
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => [s.latitude as number, s.longitude as number]);
    
    if (userLocation) {
      coordinates.push(userLocation);
    }
    
    // If we have coordinates, fit bounds to show all markers
    if (coordinates.length > 0) {
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        map.getBounds()
      );
      
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [services, userLocation, map]);
  
  return null;
}

export function ServiceMap({ services, onContactProvider }: ServiceMapProps) {
  const [, setLocation] = useLocation();
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to center of India
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Get user's location if they allow it
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Filter services with valid lat and lng
  const validServices = services.filter(
    (service) => 
      service.latitude !== undefined && 
      service.latitude !== null && 
      service.longitude !== undefined && 
      service.longitude !== null
  );

  const handleContactClick = (service: Service) => {
    if (onContactProvider) {
      onContactProvider(service);
    }
  };

  const handleServiceClick = (serviceId: number) => {
    setLocation(`/service/${serviceId}`);
  };

  return (
    <Card className="w-full h-[500px] overflow-hidden shadow-lg card">
      <CardContent className="p-0 h-full relative">
        <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-blue-100 to-blue-50 py-2 px-4 z-[1000] shadow-sm">
          <h3 className="text-primary font-medium">Service Map</h3>
        </div>
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="z-10"
        >
          <MapSetter center={mapCenter} />
          <MapBoundsSetter services={validServices} userLocation={userLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={userLocation} 
              icon={defaultIcon}
            >
              <Popup className="rounded-lg shadow-md">
                <div className="font-medium text-primary">Your location</div>
              </Popup>
            </Marker>
          )}
          
          {/* Service markers */}
          {validServices.map((service) => (
            <Marker 
              key={service.id} 
              position={[service.latitude as number, service.longitude as number]} 
              icon={defaultIcon}
            >
              <Popup className="rounded-lg">
                <div className="space-y-2">
                  <h3 className="font-medium text-primary">{service.title}</h3>
                  <p className="text-sm">{service.description.substring(0, 100)}...</p>
                  <p className="text-sm font-medium bg-blue-50 px-2 py-1 rounded-md inline-block">Category: {service.category}</p>
                  <div className="flex justify-between mt-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleServiceClick(service.id)}
                      className="btn-transition flex-1"
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleContactClick(service)}
                      className="btn-transition flex-1"
                    >
                      Contact
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}