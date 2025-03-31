import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, X } from 'lucide-react';

// Define the structure for location search results
interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: { 
    displayName: string;
    lat: number;
    lon: number;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({ 
  onLocationSelect,
  placeholder,
  className
}: LocationSearchProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSelectedLocation = useRef(false);

  // Keep popover open when there are results or when loading
  useEffect(() => {
    if (isLoading || (results.length > 0 && searchTerm.length > 1)) {
      setOpen(true);
    }
  }, [isLoading, results, searchTerm]);

  // Reset location selection flag when search term changes
  useEffect(() => {
    if (searchTerm.length > 0 && !hasSelectedLocation.current) {
      setOpen(true);
    }
    if (searchTerm.length === 0) {
      hasSelectedLocation.current = false;
    }
  }, [searchTerm]);

  // Clear any existing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim for OpenStreetMap geocoding with additional parameters
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'Accept-Language': 'en', // You can make this dynamic based on user language
            'User-Agent': 'JobBazaar Marketplace App'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        // Keep popover open if we have results
        if (data.length > 0) {
          setOpen(true);
        }
      } else {
        console.error('Error searching locations:', response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    hasSelectedLocation.current = false;
    
    // Debounce the search to avoid too many requests
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(() => {
      searchLocations(value);
    }, 300); // Reduced debounce time for better responsiveness
  };

  const handleSelectLocation = (result: LocationResult) => {
    onLocationSelect({
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    });
    setSearchTerm(result.display_name);
    hasSelectedLocation.current = true;
    setOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    hasSelectedLocation.current = false;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <Popover 
        open={open} 
        onOpenChange={(isOpen) => {
          // Only allow manual closing if we're not loading
          if (!isLoading || !isOpen) {
            setOpen(isOpen);
          }
        }}
      >
        <PopoverTrigger asChild>
          <div className={`flex items-center relative ${className}`}>
            <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholder || t('filters.searchLocation')}
              className="pl-9 pr-10" // Extra padding for clear button
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchTerm.length > 1 && !hasSelectedLocation.current) {
                  setOpen(true);
                }
              }}
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 h-5 w-5 p-0"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear</span>
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 z-50" 
          align="start"
          sideOffset={5}
        >
          <div className="py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-[300px] overflow-auto">
                {results.map((result) => (
                  <Button
                    key={result.place_id}
                    variant="ghost"
                    className="w-full justify-start text-left font-normal px-2 py-2 h-auto"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <MapPin className="mr-2 h-4 w-4 shrink-0 text-primary" />
                    <span className="line-clamp-2 text-sm">{result.display_name}</span>
                  </Button>
                ))}
              </div>
            ) : searchTerm.length > 1 ? (
              <p className="text-sm text-center py-4 text-muted-foreground">
                {t('filters.noLocationsFound')}
              </p>
            ) : (
              <p className="text-sm text-center py-4 text-muted-foreground">
                {t('filters.typeToSearch')}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}