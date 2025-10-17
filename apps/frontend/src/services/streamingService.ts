export interface StreamingMessage {
  type: 'message' | 'error' | 'complete' | 'typing' | 'analysis';
  content: string;
  timestamp: number;
  metadata?: {
    analysisId?: string;
    plantInfo?: any;
    weatherInfo?: any;
    productInfo?: any;
  };
}

export interface StreamingOptions {
  url?: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastError: string | null;
  reconnectAttempts: number;
}

export class StreamingService {
  private static instance: StreamingService;
  private ws: WebSocket | null = null;
  private options: StreamingOptions;
  private state: ConnectionState;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private messageQueue: string[] = [];

  private constructor(options: StreamingOptions = {}) {
    this.options = {
      url: 'ws://localhost:4001',
      protocols: [],
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      heartbeatInterval: 30000,
      ...options
    };

    this.state = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      lastError: null,
      reconnectAttempts: 0
    };
  }

  static getInstance(options?: StreamingOptions): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService(options);
    }
    return StreamingService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state.isConnected || this.state.isConnecting) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.state.isConnecting = true;
        this.state.lastError = null;

        this.ws = new WebSocket(this.options.url!, this.options.protocols);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.state.isConnected = true;
          this.state.isConnecting = false;
          this.state.isReconnecting = false;
          this.state.reconnectAttempts = 0;
          
          // Send queued messages
          this.flushMessageQueue();
          
          // Start heartbeat
          this.startHeartbeat();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.state.isConnected = false;
          this.state.isConnecting = false;
          this.stopHeartbeat();
          
          // Attempt reconnection if not a clean close
          if (event.code !== 1000 && this.state.reconnectAttempts < this.options.reconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.state.lastError = 'Connection error';
          this.state.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.state.isConnecting = false;
        this.state.lastError = 'Failed to create WebSocket connection';
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.state.isConnected = false;
    this.state.isConnecting = false;
    this.state.isReconnecting = false;
    
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  sendMessage(message: string | object): void {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    if (this.state.isConnected && this.ws) {
      this.ws.send(messageStr);
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(messageStr);
      
      // Try to connect if not connected
      if (!this.state.isConnecting && !this.state.isConnected) {
        this.connect().catch(console.error);
      }
    }
  }

  /**
   * Send chat message for analysis
   */
  sendChatMessage(message: {
    text?: string;
    imageUrl?: string;
    weather?: any;
    sessionId?: string;
  }): void {
    this.sendMessage({
      type: 'chat',
      data: message,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to message events
   */
  onMessage(handler: (message: StreamingMessage) => void): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.messageHandlers.set(id, handler);
    return id;
  }

  /**
   * Unsubscribe from message events
   */
  offMessage(handlerId: string): void {
    this.messageHandlers.delete(handlerId);
  }

  /**
   * Subscribe to specific message types
   */
  onMessageType(type: string, handler: (data: any) => void): string {
    return this.onMessage((message) => {
      if (message.type === type) {
        handler(message);
      }
    });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get last error
   */
  getLastError(): string | null {
    return this.state.lastError;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    const message: StreamingMessage = {
      type: data.type || 'message',
      content: data.content || data.message || '',
      timestamp: data.timestamp || Date.now(),
      metadata: data.metadata
    };

    // Notify all handlers
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Send queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state.isConnected) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(message);
      }
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.state.isReconnecting = true;
    this.state.reconnectAttempts++;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // Reconnection failed, will be handled by onclose
      });
    }, this.options.reconnectDelay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.state.isConnected) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.messageQueue = [];
  }
}

// Export singleton instance
export const streamingService = StreamingService.getInstance();
