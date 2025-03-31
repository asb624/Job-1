/**
 * Utility functions for working with geolocation
 */

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp?: number;
}

export interface GeolocationResult {
  success: boolean;
  position?: GeolocationPosition;
  error?: GeolocationPositionError | Error;
  displayName?: string;
}

/**
 * Gets the user's current position using the Geolocation API
 * @returns Promise with the position or error
 */
export const getCurrentPosition = (): Promise<GeolocationResult> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: new Error('Geolocation is not supported by your browser')
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          position: {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            },
            timestamp: position.timestamp
          }
        });
      },
      (error) => {
        resolve({
          success: false,
          error
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 60000 // 1 minute
      }
    );
  });
};

/**
 * Reverse geocodes coordinates to get a location name
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise with the location display name
 */
export const reverseGeocode = async (
  latitude: number, 
  longitude: number
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'JobBazaar Marketplace App'
        }
      }
    );

    if (!response.ok) {
      console.error('Error reverse geocoding:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Get the current location with display name
 * @returns Promise with location information
 */
export const getLocationWithDisplayName = async (): Promise<GeolocationResult> => {
  const result = await getCurrentPosition();
  
  if (!result.success || !result.position) {
    return result;
  }

  try {
    const displayName = await reverseGeocode(
      result.position.coords.latitude,
      result.position.coords.longitude
    );

    return {
      ...result,
      displayName: displayName || undefined
    };
  } catch (error) {
    // Still return the position even if reverse geocoding fails
    return result;
  }
};