import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface Location {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchProps {
  onSelectLocation: (location: Location | null) => void;
  selectedLocation?: Location | null;
}

export function LocationSearch({ onSelectLocation, selectedLocation }: LocationSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search using Nominatim API
  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Debounce search to avoid too many requests
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        // Using OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en', // Default to English results
              'User-Agent': 'JobBazaarApp/1.0' // Identifying our app as per Nominatim usage policy
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Search failed. Please try again.');
        }
        
        const data = await response.json();
        
        const locations = data.map((item: any) => ({
          name: item.display_name.split(',')[0],
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        }));
        
        setSearchResults(locations);
        setIsLoading(false);
      }, 500); // 500ms debounce
    } catch (err) {
      console.error('Error searching locations:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'JobBazaarApp/1.0'
                }
              }
            );
            
            if (!response.ok) {
              throw new Error('Could not determine your location name');
            }
            
            const data = await response.json();
            
            const locationObject: Location = {
              name: data.name || data.address.city || data.address.town || data.address.village || 'Your Location',
              displayName: data.display_name,
              latitude,
              longitude
            };
            
            onSelectLocation(locationObject);
            setIsOpen(false);
          } catch (err) {
            console.error('Error reverse geocoding:', err);
            // Even if reverse geocoding fails, still return a location with coordinates
            const locationObject: Location = {
              name: 'Your Location',
              displayName: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              latitude,
              longitude
            };
            onSelectLocation(locationObject);
            setIsOpen(false);
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError(t('postService.locationError'));
          setIsLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSelectLocation = (location: Location) => {
    onSelectLocation(location);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectLocation(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (searchQuery) {
      searchLocations(searchQuery);
    }
  }, [searchQuery]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="justify-between w-56 px-3 bg-white border border-teal-200 text-teal-700 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="truncate">
              {selectedLocation ? selectedLocation.name : t('filters.anyLocation')}
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <CommandList>
          <CommandInput
            placeholder={t('postService.cityPlaceholder')}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {isLoading ? t('common.loading') : error || t('postService.noLocationsFound')}
          </CommandEmpty>
          
          <CommandGroup>
            <CommandItem
              onSelect={getCurrentLocation}
              className="flex items-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              {t('postService.useMyLocation')}
            </CommandItem>
            
            {selectedLocation && (
              <CommandItem
                onSelect={handleClear}
                className="flex items-center gap-2 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
                {t('filters.anyLocation')}
              </CommandItem>
            )}
          </CommandGroup>
          
          {searchResults.length > 0 && (
            <>
              <Separator className="my-1" />
              
              <CommandGroup heading={t('postService.searchResults')}>
                {searchResults.map((location, index) => (
                  <CommandItem
                    key={`${location.name}-${index}`}
                    onSelect={() => handleSelectLocation(location)}
                    className="flex flex-col items-start cursor-pointer"
                  >
                    <div className="font-medium">{location.name}</div>
                    <div className="text-xs text-gray-500 truncate w-full">{location.displayName}</div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </PopoverContent>
    </Popover>
  );
}