/**
 * Queue for marking notifications as read
 * Ensures requests are sent even if component unmounts during navigation
 */

interface QueuedRequest {
  notificationId: string;
  timestamp: number;
  retries: number;
}

class NotificationReadQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private maxRetries = 3;

  /**
   * Add notification to queue
   */
  enqueue(notificationId: string) {
    // Check if already in queue
    if (this.queue.some(item => item.notificationId === notificationId)) {
      return;
    }

    this.queue.push({
      notificationId,
      timestamp: Date.now(),
      retries: 0,
    });

    
    // Start processing if not already processing
    // Don't start immediately - wait for navigation to complete
    if (!this.processing) {
      // Delay processing to ensure navigation has completed
      setTimeout(() => {
        if (!this.processing && this.queue.length > 0) {
          this.processQueue();
        }
      }, 3000); // Wait 3 seconds before starting to process
    }
  }

  /**
   * Process queue
   */
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    // Additional wait to ensure navigation has completed and page is stable
    // This reduces the chance of network errors during navigation
    // Note: We already wait 3s in enqueue, but add a small buffer here too
    await new Promise(resolve => setTimeout(resolve, 1000));

    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        // Use fetch with keepalive to ensure request is sent even if page navigates
        const success = await this.markAsReadWithFetch(item.notificationId);
        
        if (success) {
          this.queue.shift(); // Remove from queue
        } else {
          throw new Error('Mark as read failed');
        }
      } catch (error: any) {
        // Don't log network errors as errors - they're expected during navigation
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                               error.name === 'TypeError' ||
                               error.message?.includes('NetworkError');
        
        if (!isNetworkError) {
          console.error(`❌ [NotificationQueue] Error marking notification ${item.notificationId} as read:`, error);
        } else {
        }
        
        item.retries++;
        
        if (item.retries >= this.maxRetries) {
          // Only log if it's not a network error (network errors are expected)
          if (!isNetworkError) {
            console.error(`❌ [NotificationQueue] Max retries reached for notification ${item.notificationId}. Removing from queue.`);
          } else {
          }
          this.queue.shift(); // Remove from queue after max retries
        } else {
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(item);
          if (!isNetworkError) {
          }
          
          // Wait before retry (exponential backoff)
          // Increased delay to give more time between retries
          await new Promise(resolve => setTimeout(resolve, 3000 * item.retries));
        }
      }
    }

    this.processing = false;
  }

  /**
   * Mark as read using fetch with keepalive
   * This ensures the request is sent even if the page navigates
   */
  private async markAsReadWithFetch(notificationId: string): Promise<boolean> {
    try {
      const { API_CONFIG } = await import('../config/api');
      const { getAccessToken } = await import('./authService');
      
      const token = getAccessToken();
      if (!token) {
        console.error('❌ [NotificationQueue] No access token available');
        return false;
      }

      const url = `${API_CONFIG.BASE_URL}/notifications/${notificationId}/read`;
      
      // Try using sendBeacon first (most reliable for navigation scenarios)
      // sendBeacon is specifically designed for requests that need to be sent even during page unload
      // However, sendBeacon only supports POST with FormData or Blob, so we'll use fetch with keepalive
      
      // Use fetch with keepalive to ensure request is sent even if page navigates
      // Note: AbortSignal.timeout may not work well with keepalive, so we use a manual timeout
      // Don't use AbortController with keepalive - it can interfere with the request
      // Instead, rely on the browser's keepalive mechanism
      
      try {
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          keepalive: true, // This ensures the request is sent even if page navigates
          // Note: Don't use signal with keepalive as it can cause issues
        });
        
        
        if (!response.ok) {
          // Try to read error response, but don't block if it fails
          let errorData = {};
          try {
            errorData = await response.json();
          } catch (e) {
            // Ignore JSON parse errors
          }
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return true;
      } catch (fetchError: any) {
        // Don't log network errors as errors - they're expected during navigation
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('Failed to fetch')) {
          // Log more details for debugging
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack?.substring(0, 200),
          });
        } else {
          console.error(`❌ [NotificationQueue] Error in markAsReadWithFetch:`, fetchError);
        }
        throw fetchError;
      }
    } catch (error: any) {
      // Handle any other errors
      if (error.name !== 'AbortError' && !error.message?.includes('Failed to fetch')) {
        console.error(`❌ [NotificationQueue] Unexpected error in markAsReadWithFetch:`, error);
      }
      throw error;
    }
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}

// Singleton instance
export const notificationReadQueue = new NotificationReadQueue();

