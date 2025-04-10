import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, X, Navigation } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getLocationWithDisplayName } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';
import { createPortal } from 'react-dom';

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
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the component to close results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    // Close on escape key
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowResults(false);
      }
    }

    // Update dropdown position when window scrolls or resizes
    function updateDropdownPosition() {
      if (showResults && inputRef.current && resultsRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        resultsRef.current.style.width = `${inputRef.current.offsetWidth}px`;
        resultsRef.current.style.left = `${rect.left}px`;
        resultsRef.current.style.top = `${rect.bottom + 5}px`;
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('scroll', updateDropdownPosition);
    window.addEventListener('resize', updateDropdownPosition);
    
    // Initial position update
    updateDropdownPosition();
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('scroll', updateDropdownPosition);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [showResults]);

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
        // Show results if we have any
        if (data.length > 0) {
          setShowResults(true);
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
    
    // Show the results dropdown as soon as typing starts
    if (value.length > 0) {
      setShowResults(true);
    }
    
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
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Auto-detect user's current location using geolocation API
   */
  const detectCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const result = await getLocationWithDisplayName();
      
      if (!result.success || !result.position) {
        toast({
          title: t('common.error'),
          description: result.error?.message || t('location.detectionFailed'),
          variant: 'destructive',
        });
        return;
      }

      // Success - we have coordinates and possibly a display name
      onLocationSelect({
        displayName: result.displayName || t('location.currentLocation'),
        lat: result.position.coords.latitude,
        lon: result.position.coords.longitude
      });

      // Update the input field
      setSearchTerm(result.displayName || t('location.currentLocation'));
      setShowResults(false);
      
      toast({
        title: t('location.locationDetected'),
        description: result.displayName || t('location.coordinatesDetected'),
      });
    } catch (error) {
      console.error('Error detecting location:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('location.detectionFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className={`flex items-center relative ${className}`}>
        <MapPin className="absolute left-3 h-4 w-4 z-10" style={{
          color: className?.includes('text-white') || className?.includes('bg-white/20') ? 'white' : 'var(--muted-foreground)'
        }} />
        <Input
          ref={inputRef}
          placeholder={placeholder || t('filters.searchLocation')}
          className={`pl-9 pr-10 ${className?.includes('bg-white/20') ? 'bg-white/20 placeholder-white/70 text-white focus-visible:ring-white/50 border-white/30' : ''}`} // Extra padding for clear button
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            // Show dropdown with initial option on focus
            setShowResults(true);
          }}
          style={{
            WebkitTextFillColor: className?.includes('text-white') || className?.includes('bg-white/20') ? 'white' : 'inherit'
          }}
        />
        {searchTerm ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`absolute right-2 h-5 w-5 p-0 z-10 ${className?.includes('text-white') || className?.includes('bg-white/20') ? 'text-white hover:text-white/80 hover:bg-white/10' : ''}`}
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`absolute right-2 h-5 w-5 p-0 z-10 ${className?.includes('text-white') || className?.includes('bg-white/20') ? 'text-white hover:text-white/80 hover:bg-white/10' : ''}`}
            onClick={detectCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className={`h-4 w-4 animate-spin ${className?.includes('text-white') || className?.includes('bg-white/20') ? 'text-white' : ''}`} />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            <span className="sr-only">{t('location.useMyLocation')}</span>
          </Button>
        )}
      </div>

      {/* Custom dropdown using React Portal for perfect stacking context */}
      {showResults && createPortal(
        <div 
          ref={resultsRef}
          className="fixed bg-background border border-input rounded-md shadow-xl mt-1 z-[9999] max-h-[350px] overflow-y-auto"
          style={{ 
            width: inputRef.current ? inputRef.current.offsetWidth + 'px' : '100%',
            left: inputRef.current ? inputRef.current.getBoundingClientRect().left + 'px' : '0',
            top: inputRef.current ? (inputRef.current.getBoundingClientRect().bottom + 5) + 'px' : '0'
          }}
        >
          <div className="py-2">
            {/* Current location option at the top of the dropdown */}
            {!isLoading && searchTerm.length === 0 && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2"
                onClick={detectCurrentLocation}
                type="button"
                disabled={isLocating}
              >
                <Navigation className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">
                  {isLocating ? t('location.searchingLocation') : t('location.useMyLocation')}
                </span>
                {isLocating && <Loader2 className="h-3 w-3 ml-2 animate-spin" />}
              </button>
            )}

            {/* Search results or loading state */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <>
                {results.map((result) => (
                  <button
                    key={result.place_id}
                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-start gap-2"
                    onClick={() => handleSelectLocation(result)}
                    type="button"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span className="line-clamp-2 text-sm">{result.display_name}</span>
                  </button>
                ))}
              </>
            ) : searchTerm.length > 1 ? (
              <p className="text-sm text-center py-4 text-muted-foreground">
                {t('filters.noLocationsFound')}
              </p>
            ) : searchTerm.length === 0 ? (
              <p className="text-sm text-center py-2 text-muted-foreground">
                {t('filters.typeToSearch')}
              </p>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}