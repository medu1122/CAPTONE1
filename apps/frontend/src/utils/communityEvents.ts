// Simple event emitter for community real-time updates
type CommunityEventCallback = () => void;

class CommunityEventEmitter {
  private listeners: Set<CommunityEventCallback> = new Set();

  subscribe(callback: CommunityEventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit() {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[CommunityEvents] Error in callback:', error);
      }
    });
  }
}

export const communityEvents = new CommunityEventEmitter();

