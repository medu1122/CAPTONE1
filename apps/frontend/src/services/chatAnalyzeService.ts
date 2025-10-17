import { API_CONFIG } from '../config/api';

export interface ChatAnalyzeRequest {
  message?: string;
  imageUrl?: string;
  weather?: {
    current: {
      temperature: number;
      humidity: number;
      description: string;
    };
  };
}

export interface ChatAnalyzeResponse {
  success: boolean;
  data: {
    type: 'text-only' | 'image-only' | 'image-text';
    response: string;
    context: {
      hasPlantContext: boolean;
      hasWeatherContext: boolean;
      hasProductContext: boolean;
      plantInfo?: any;
      weatherInfo?: any;
      productInfo?: any[];
    };
    meta: {
      tokens: number;
      model: string;
      processingTime: number;
    };
  };
}

export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    description: string;
  };
}

export class ChatAnalyzeService {
  private static instance: ChatAnalyzeService;
  
  private constructor() {}
  
  static getInstance(): ChatAnalyzeService {
    if (!ChatAnalyzeService.instance) {
      ChatAnalyzeService.instance = new ChatAnalyzeService();
    }
    return ChatAnalyzeService.instance;
  }

  /**
   * Main chat analyze endpoint
   */
  async analyzeChat(data: ChatAnalyzeRequest): Promise<ChatAnalyzeResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.MAIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat analyze error:', error);
      throw new Error(`Failed to analyze chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Text-only processing
   */
  async analyzeTextOnly(data: {
    message: string;
    weather?: WeatherData;
  }): Promise<ChatAnalyzeResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.TEXT_ONLY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Text analysis error:', error);
      throw new Error(`Failed to analyze text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Image-only processing
   */
  async analyzeImageOnly(data: {
    imageUrl: string;
  }): Promise<ChatAnalyzeResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.IMAGE_ONLY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Image + Text processing
   */
  async analyzeImageText(data: {
    message: string;
    imageUrl: string;
  }): Promise<ChatAnalyzeResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.IMAGE_TEXT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image+Text analysis error:', error);
      throw new Error(`Failed to analyze image and text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    success: boolean;
    data: {
      status: string;
      supportedTypes: string[];
      features: string[];
      endpoints: Record<string, string>;
    };
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.STATUS}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Status check error:', error);
      throw new Error(`Failed to get system status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const chatAnalyzeService = ChatAnalyzeService.getInstance();
