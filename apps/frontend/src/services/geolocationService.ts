export interface LocationResult {
  name: string;
  local_names?: {
    [key: string]: string;
  };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export class GeolocationService {
  private static instance: GeolocationService;
  private readonly OPENWEATHER_API_KEY = '8746155ce8ae7dc53fc1878b6e204099';
  private readonly OPENWEATHER_GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0';
  
  private constructor() {}
  
  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Get current position using Browser Geolocation API
   */
  async getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<{ lat: number; lon: number; accuracy?: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new GeolocationError({
          code: 0,
          message: 'Geolocation is not supported by this browser',
          type: 'UNKNOWN'
        }));
        return;
      }

      const defaultOptions: GeolocationOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      const finalOptions = { ...defaultOptions, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          const geolocationError = this.mapGeolocationError(error);
          reject(geolocationError);
        },
        finalOptions
      );
    });
  }

  /**
   * Search for locations using OpenWeather Geocoding API
   */
  async searchLocation(
    query: string, 
    limit: number = 5
  ): Promise<LocationResult[]> {
    try {
      if (!query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      const response = await fetch(
        `${this.OPENWEATHER_GEOCODING_URL}/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${this.OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const results: LocationResult[] = await response.json();
      return results;
    } catch (error) {
      console.error('Location search error:', error);
      throw new Error(`Failed to search locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get location name from coordinates using reverse geocoding
   */
  async getLocationName(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `${this.OPENWEATHER_GEOCODING_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status} ${response.statusText}`);
      }

      const results: LocationResult[] = await response.json();
      
      if (results.length === 0) {
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }

      const location = results[0];
      const parts = [location.name];
      
      if (location.state) {
        parts.push(location.state);
      }
      
      if (location.country) {
        parts.push(location.country);
      }

      return parts.join(', ');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  /**
   * Get location with fallback mechanism
   * 1. Try browser geolocation
   * 2. If denied/unavailable, prompt for manual search
   */
  async getLocationWithFallback(
    searchQuery?: string
  ): Promise<{
    lat: number;
    lon: number;
    name: string;
    source: 'browser' | 'search';
    accuracy?: number;
  }> {
    try {
      // Try browser geolocation first
      const position = await this.getCurrentPosition();
      const name = await this.getLocationName(position.lat, position.lon);
      
      return {
        lat: position.lat,
        lon: position.lon,
        name,
        source: 'browser',
        accuracy: position.accuracy
      };
    } catch (error) {
      console.log('Browser geolocation failed, trying search fallback:', error);
      
      // Fallback to search
      if (!searchQuery) {
        throw new Error('Geolocation denied and no search query provided');
      }

      const searchResults = await this.searchLocation(searchQuery, 1);
      
      if (searchResults.length === 0) {
        throw new Error('No locations found for the search query');
      }

      const location = searchResults[0];
      return {
        lat: location.lat,
        lon: location.lon,
        name: this.formatLocationName(location),
        source: 'search'
      };
    }
  }

  /**
   * Check if geolocation is supported
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check if geolocation permission is granted
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isGeolocationSupported()) {
      return 'denied';
    }

    try {
      // Modern browsers support permissions API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return permission.state;
      }
      
      // Fallback: try to get position with very short timeout
      await this.getCurrentPosition({ timeout: 1 });
      return 'granted';
    } catch (error) {
      if (error instanceof GeolocationError) {
        switch (error.type) {
          case 'PERMISSION_DENIED':
            return 'denied';
          case 'TIMEOUT':
            return 'prompt';
          default:
            return 'prompt';
        }
      }
      return 'prompt';
    }
  }

  /**
   * Format location name from search result
   */
  private formatLocationName(location: LocationResult): string {
    const parts = [location.name];
    
    if (location.state) {
      parts.push(location.state);
    }
    
    if (location.country) {
      parts.push(location.country);
    }

    return parts.join(', ');
  }

  /**
   * Map browser geolocation error to our error type
   */
  private mapGeolocationError(error: GeolocationPositionError): GeolocationError {
    let type: GeolocationError['type'];
    let message: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        type = 'PERMISSION_DENIED';
        message = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        type = 'POSITION_UNAVAILABLE';
        message = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        type = 'TIMEOUT';
        message = 'Location request timed out';
        break;
      default:
        type = 'UNKNOWN';
        message = 'Unknown geolocation error';
    }

    return new GeolocationError({
      code: error.code,
      message,
      type
    });
  }
}

// Custom error class
export class GeolocationError extends Error {
  public code: number;
  public type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';

  constructor({ code, message, type }: { code: number; message: string; type: GeolocationError['type'] }) {
    super(message);
    this.name = 'GeolocationError';
    this.code = code;
    this.type = type;
  }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();
