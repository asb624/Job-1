import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Service, Requirement } from '@shared/schema';
import { Card, CardContent } from '../ui/card';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

// Fix for default marker icon issue in Leaflet with webpack/vite
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const serviceIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'service-marker' // We'll style this with CSS
});

const requirementIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'requirement-marker' // We'll style this with CSS
});

// Component to recenter the map when coordinates change
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

interface ServiceMapProps {
  services?: Service[];
  requirements?: Requirement[];
  center?: [number, number];
  initialZoom?: number;
  height?: string;
  onServiceClick?: (service: Service) => void;
  onRequirementClick?: (requirement: Requirement) => void;
  onContactProvider?: (service: Service) => void;
}

export function ServiceMap({
  services = [],
  requirements = [],
  center = [20.5937, 78.9629], // Default to center of India
  initialZoom = 5,
  height = '400px',
  onServiceClick,
  onRequirementClick,
  onContactProvider
}: ServiceMapProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const mapRef = useRef<any>(null);

  // Handle user location
  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 12);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  // Filter out services and requirements without valid coordinates
  const validServices = services.filter(
    (service) => service.latitude && service.longitude
  );
  
  const validRequirements = requirements.filter(
    (requirement) => requirement.latitude && requirement.longitude
  );

  return (
    <div className="relative w-full" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Display Services */}
        {validServices.map((service) => (
          <Marker
            key={`service-${service.id}`}
            position={[service.latitude!, service.longitude!]}
            icon={serviceIcon}
            eventHandlers={{
              click: () => onServiceClick && onServiceClick(service)
            }}
          >
            <Popup>
              <Card className="border-none shadow-none">
                <CardContent className="p-2">
                  <h3 className="font-medium text-sm">{service.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{service.category}</p>
                  <p className="text-xs font-medium text-green-600 mt-1">₹{service.price}</p>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      className="text-xs text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/service/${service.id}`)}
                    >
                      {t("View details")}
                    </button>
                    {onContactProvider && (
                      <button 
                        className="text-xs text-green-600 cursor-pointer"
                        onClick={() => onContactProvider(service)}
                      >
                        {t("Contact")}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
        
        {/* Display Requirements */}
        {validRequirements.map((requirement) => (
          <Marker
            key={`requirement-${requirement.id}`}
            position={[requirement.latitude!, requirement.longitude!]}
            icon={requirementIcon}
            eventHandlers={{
              click: () => onRequirementClick && onRequirementClick(requirement)
            }}
          >
            <Popup>
              <Card className="border-none shadow-none">
                <CardContent className="p-2">
                  <h3 className="font-medium text-sm">{requirement.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{requirement.category}</p>
                  <p className="text-xs font-medium text-orange-600 mt-1">
                    {t("Budget")}: ₹{requirement.budget}
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button 
                      className="text-xs text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/requirement/${requirement.id}`)}
                    >
                      {t("View details")}
                    </button>
                    {onRequirementClick && (
                      <button 
                        className="text-xs text-orange-600 cursor-pointer"
                        onClick={() => onRequirementClick(requirement)}
                      >
                        {t("Bid")}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={defaultIcon}>
            <Popup>{t("Your location")}</Popup>
          </Marker>
        )}
        
        {/* Update map view when center changes */}
        <ChangeMapView center={mapCenter} />
      </MapContainer>
      
      {/* User location button */}
      <button
        onClick={handleGetUserLocation}
        className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-md hover:bg-gray-100 focus:outline-none"
        title={t("Use my location")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5 5 4 4 0 0 1-5-5 4 4 0 0 1 5-5 4 4 0 0 1 5 5 10 10 0 0 0-10-10Z"/>
        </svg>
      </button>
    </div>
  );
}