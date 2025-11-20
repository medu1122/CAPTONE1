import { API_CONFIG } from '../config/api';

export interface StreamingChatRequest {
  message?: string;
  imageUrl?: string;
  weather?: {
    current: {
      temperature: number;
      humidity: number;
      description: string;
    };
  };
  sessionId?: string;
}

export interface StreamingChatResponse {
  content: string;
  type: 'text' | 'analysis' | 'error';
  metadata?: {
    analysisId?: string;
    plantInfo?: any;
    weatherInfo?: any;
    productInfo?: any;
  };
}

export class StreamingChatService {
  private static instance: StreamingChatService;
  
  private constructor() {}
  
  static getInstance(): StreamingChatService {
    if (!StreamingChatService.instance) {
      StreamingChatService.instance = new StreamingChatService();
    }
    return StreamingChatService.instance;
  }

  /**
   * Start streaming chat with SSE
   */
  async startStreamingChat(
    data: StreamingChatRequest,
    onChunk: (chunk: StreamingChatResponse) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Get access token for authentication
      const accessToken = (window as any).accessToken || null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      };
      
      // Add Authorization header if token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.STREAM}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('SSE stream completed');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                console.log('Stream marked as complete');
                onComplete(fullResponse);
                return;
              }

              try {
                const parsed: any = JSON.parse(data);
                
                // Handle different response formats from backend
                let content = '';
                
                // Format 1: { result: { response: "..." } } - from complete event
                if (parsed.result?.response) {
                  content = parsed.result.response;
                  fullResponse = content; // Use full response, not append
                  
                  // Pass full result object as metadata (includes treatments, additionalInfo)
                  onChunk({ 
                    content,
                    metadata: parsed.result  // ← Pass full result object
                  } as StreamingChatResponse);
                }
                // Format 2: { content: "..." } - streaming chunks
                else if (parsed.content) {
                  content = parsed.content;
                  fullResponse += content;
                  
                  onChunk({ 
                    content,
                    metadata: parsed.metadata || parsed.result
                  } as StreamingChatResponse);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', data, parseError);
                // Continue processing other chunks
              }
            } else if (line.startsWith('event: ')) {
              // Handle SSE events if needed
              const eventType = line.slice(7);
              console.log('SSE event:', eventType);
            } else if (line.startsWith('id: ')) {
              // Handle SSE ID if needed
              const id = line.slice(4);
              console.log('SSE ID:', id);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Streaming chat error:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }

  /**
   * Start streaming with EventSource (alternative approach)
   */
  startEventSourceStreaming(
    data: StreamingChatRequest,
    onMessage: (event: MessageEvent) => void,
    onError: (error: Event) => void,
    onOpen: () => void
  ): EventSource {
    // Create a URL with query parameters for GET request
    const params = new URLSearchParams();
    if (data.message) params.append('message', data.message);
    if (data.imageUrl) params.append('imageUrl', data.imageUrl);
    if (data.sessionId) params.append('sessionId', data.sessionId);
    if (data.weather) params.append('weather', JSON.stringify(data.weather));

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.STREAM}?${params.toString()}`;
    
    const eventSource = new EventSource(url);
    
    eventSource.onopen = onOpen;
    eventSource.onmessage = onMessage;
    eventSource.onerror = onError;
    
    return eventSource;
  }

  /**
   * Test SSE connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.STATUS}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('SSE connection test failed:', error);
      return false;
    }
  }

  /**
   * Get streaming status
   */
  async getStreamingStatus(): Promise<{
    isAvailable: boolean;
    endpoints: string[];
    features: string[];
  }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_ANALYZE.STATUS}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        isAvailable: data.success,
        endpoints: data.data?.endpoints || [],
        features: data.data?.features || []
      };
    } catch (error) {
      console.error('Failed to get streaming status:', error);
      return {
        isAvailable: false,
        endpoints: [],
        features: []
      };
    }
  }
}

// Export singleton instance
export const streamingChatService = StreamingChatService.getInstance();
