import { API_CONFIG } from '../config/api';
import axios from 'axios';

export interface WeatherForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  humidity: number;
  description: string;
  icon: string;
  rain: number;
}

export interface ProvinceInfo {
  provinceName: string;
  provinceCode: string;
  temperature: number | null;
  weatherDescription: string | null;
  weatherForecast: WeatherForecastDay[] | null; // 5 days forecast
  soilTypes: string[]; // Simple array for backward compatibility
  soilDetails: Array<{
    type: string;
    domsoil?: string;
    faosoil?: string;
  }>; // Full details including domsoil and faosoil
  currentMonth: {
    month: number;
    planting: string[];
    harvesting: string[];
  };
  articles: Array<{
    title: string;
    url: string;
    source?: string;
    date?: string;
    imageUrl?: string;
  }>;
  source: string;
}

export interface ProvinceBasic {
  provinceCode: string;
  provinceName: string;
  simpleMapsId?: string;
}

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Separate axios instance for recommendation API (GPT needs more time)
const recommendationApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 60000, // 60 seconds for GPT API
});

export interface NoteLink {
  text: string;
  url: string;
}

export interface Note {
  text: string;
  links?: NoteLink[];
  hasLinks?: boolean;
  raw?: string;
}

export interface ProvinceRecommendation {
  season: string | null;
  crops: string[];
  harvesting: string[];
  weather: string | null;
  notes: (string | Note)[]; // Support both old string format and new Note format
}

export const provinceService = {
  /**
   * Get all provinces
   */
  async getAllProvinces(): Promise<ProvinceBasic[]> {
    const response = await api.get('/provinces');
    return response.data.data;
  },

  /**
   * Get province information
   */
  async getProvinceInfo(code: string): Promise<ProvinceInfo> {
    try {
      console.log('🌐 Fetching province info for:', code);
      const response = await api.get(`/provinces/${code}/info`);
      console.log('✅ Province info response:', response.data);
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error in getProvinceInfo:', error);
      console.error('Request URL:', error.config?.url);
      console.error('Response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Get AI recommendation for crop planting
   */
  async getProvinceRecommendation(code: string): Promise<ProvinceRecommendation> {
    try {
      console.log('🤖 Fetching AI recommendation for:', code);
      const response = await recommendationApi.get(`/provinces/${code}/recommendation`);
      console.log('✅ Recommendation response:', response.data);
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }
      // Backend now returns structured object directly
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error in getProvinceRecommendation:', error);
      throw error;
    }
  },
};

