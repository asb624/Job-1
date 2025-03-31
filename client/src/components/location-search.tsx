import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Search } from 'lucide-react';

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

  useEffect(() => {
    // Clear any existing timeout when component unmounts
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
      // Using Nominatim for OpenStreetMap geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en', // You can make this dynamic based on the user's selected language
            'User-Agent': 'JobBazaar Marketplace App' // It's good practice to identify your application
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
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
    
    // Debounce the search to avoid too many requests
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = window.setTimeout(() => {
      searchLocations(value);
    }, 500); // 500ms debounce
  };

  const handleSelectLocation = (result: LocationResult) => {
    onLocationSelect({
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    });
    setSearchTerm(result.display_name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`flex items-center relative ${className}`}>
          <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder || t('filters.searchLocation')}
            className="pl-9 pr-4"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
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
                  className="w-full justify-start text-left font-normal truncate px-2 py-1.5"
                  onClick={() => handleSelectLocation(result)}
                >
                  <MapPin className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{result.display_name}</span>
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
  );
}