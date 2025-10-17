import { API_CONFIG } from '../config/api';

export interface WeatherResponse {
  success: boolean;
  data: {
    location: {
      name: string;
      country: string;
      coordinates: {
        lat: number;
        lon: number;
      };
    };
    current: {
      temperature: number;
      humidity: number;
      pressure: number;
      description: string;
      icon: string;
      windSpeed: number;
      windDirection: number;
    };
    forecast: Array<{
      date: string;
      temperature: {
        min: number;
        max: number;
      };
      humidity: number;
      description: string;
      icon: string;
      rain: number;
    }>;
  };
}

export interface WeatherAlertsResponse {
  success: boolean;
  data: {
    alerts: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

export class WeatherService {
  private static instance: WeatherService;
  
  private constructor() {}
  
  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Get current weather and forecast
   */
  async getCurrentWeather(params: {
    cityName?: string;
    lat?: number;
    lon?: number;
  }): Promise<WeatherResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.cityName) {
        searchParams.append('cityName', params.cityName);
      }
      if (params.lat !== undefined) {
        searchParams.append('lat', params.lat.toString());
      }
      if (params.lon !== undefined) {
        searchParams.append('lon', params.lon.toString());
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WEATHER.CURRENT}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw new Error(`Failed to get weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get weather alerts for agricultural conditions
   */
  async getWeatherAlerts(params: {
    lat: number;
    lon: number;
  }): Promise<WeatherAlertsResponse> {
    try {
      const searchParams = new URLSearchParams({
        lat: params.lat.toString(),
        lon: params.lon.toString()
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WEATHER.ALERTS}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Weather alerts error:', error);
      throw new Error(`Failed to get weather alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get weather data with location fallback
   */
  async getWeatherWithLocation(location: {
    name?: string;
    lat?: number;
    lon?: number;
  }): Promise<WeatherResponse> {
    try {
      // Try with coordinates first if available
      if (location.lat !== undefined && location.lon !== undefined) {
        return await this.getCurrentWeather({
          lat: location.lat,
          lon: location.lon
        });
      }
      
      // Fallback to city name
      if (location.name) {
        return await this.getCurrentWeather({
          cityName: location.name
        });
      }

      throw new Error('No location information provided');
    } catch (error) {
      console.error('Weather with location error:', error);
      throw new Error(`Failed to get weather with location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const weatherService = WeatherService.getInstance();
