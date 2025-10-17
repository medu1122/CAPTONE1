# 🚀 SSE Streaming Guide

## 📋 **Tổng quan**

Backend đã được tích hợp **Server-Sent Events (SSE)** để hỗ trợ real-time streaming cho Chat Analyze. Các endpoint SSE cho phép frontend nhận dữ liệu real-time mà không cần polling.

## 🔗 **SSE Endpoints**

### **1. Chat Stream**
```
GET /api/v1/chat/stream
```

**Query Parameters:**
- `message` (string, optional): User message
- `imageUrl` (string, optional): Image URL for analysis
- `weather` (string, optional): Weather context (JSON string)
- `sessionId` (string, optional): Chat session ID

**Example:**
```bash
GET /api/v1/chat/stream?message=Cách chăm sóc cây lan?&sessionId=uuid-123
```

### **2. Analyze Stream**
```
GET /api/v1/analyze/stream
```

**Query Parameters:**
- `image` (string, optional): Image data/URL
- `text` (string, optional): Text description
- `lat` (number, optional): Latitude
- `lon` (number, optional): Longitude

**Example:**
```bash
GET /api/v1/analyze/stream?image=https://example.com/plant.jpg&lat=10.762622&lon=106.660172
```

## 📡 **SSE Event Types**

### **Connection Events**
```javascript
// Initial connection
event: connected
data: {"status":"connected","timestamp":1234567890}

// Processing started
event: processing
data: {"status":"processing","message":"Starting analysis..."}
```

### **Analysis Events**
```javascript
// Analysis type detection
event: analysis
data: {"type":"detecting","message":"Detecting analysis type..."}

// Plant context
event: context
data: {"type":"plant_context","message":"Analyzing plant context..."}

// Image processing
event: image
data: {"type":"processing","message":"Processing image..."}

// AI response chunks
event: response
data: {"partial":"Hello","chunk":0}
```

### **Completion Events**
```javascript
// Analysis complete
event: complete
data: {"status":"complete","result":{...}}

// Stream done
data: [DONE]
```

### **Error Events**
```javascript
// Error occurred
event: error
data: {"error":"Service unavailable","code":"SERVICE_ERROR"}
```

## 🎯 **Frontend Integration**

### **JavaScript EventSource**
```javascript
// Connect to chat stream
const eventSource = new EventSource('/api/v1/chat/stream?message=Cách chăm sóc cây lan?');

// Handle different event types
eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('Connected:', data);
});

eventSource.addEventListener('response', (event) => {
  const data = JSON.parse(event.data);
  console.log('Partial response:', data.partial);
  // Append to chat UI
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Analysis complete:', data.result);
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Stream error:', data.error);
});

// Close connection
eventSource.close();
```

### **React Hook Example**
```javascript
import { useState, useEffect } from 'react';

const useChatStream = (message, imageUrl) => {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!message && !imageUrl) return;

    const eventSource = new EventSource(
      `/api/v1/chat/stream?message=${encodeURIComponent(message)}&imageUrl=${encodeURIComponent(imageUrl || '')}`
    );

    setIsStreaming(true);
    setResponse('');

    eventSource.addEventListener('connected', () => {
      console.log('Stream connected');
    });

    eventSource.addEventListener('response', (event) => {
      const data = JSON.parse(event.data);
      setResponse(prev => prev + data.partial);
    });

    eventSource.addEventListener('complete', () => {
      setIsStreaming(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      const data = JSON.parse(event.data);
      setError(data.error);
      setIsStreaming(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [message, imageUrl]);

  return { response, isStreaming, error };
};
```

## 🔧 **Technical Details**

### **Headers**
```javascript
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
```

### **Response Format**
```
event: eventName
data: {"key":"value"}

event: anotherEvent
data: {"key":"value"}

data: [DONE]
```

### **Error Handling**
- **Connection errors**: Automatic reconnection
- **Timeout handling**: Server keeps connection alive
- **CORS support**: Configured for cross-origin requests

## 🚀 **Usage Examples**

### **1. Text-Only Chat**
```bash
curl -N "http://localhost:4000/api/v1/chat/stream?message=Cách chăm sóc cây lan?"
```

### **2. Image Analysis**
```bash
curl -N "http://localhost:4000/api/v1/analyze/stream?image=https://example.com/plant.jpg"
```

### **3. Combined Analysis**
```bash
curl -N "http://localhost:4000/api/v1/chat/stream?message=Cây này bị bệnh gì?&imageUrl=https://example.com/diseased-plant.jpg"
```

## 🎯 **Benefits**

### **Real-time Experience**
- ✅ **Progressive loading** - User sees response as it's generated
- ✅ **Typing effect** - ChatGPT-like experience
- ✅ **No polling** - Efficient resource usage
- ✅ **Instant feedback** - Better UX

### **Technical Advantages**
- ✅ **HTTP-based** - Easy to debug and monitor
- ✅ **Browser native** - No additional libraries needed
- ✅ **Automatic reconnection** - Built-in resilience
- ✅ **CORS support** - Cross-origin ready

## 🔍 **Debugging**

### **Browser DevTools**
1. Open Network tab
2. Look for EventSource connections
3. Monitor SSE events in real-time

### **Server Logs**
```bash
# Monitor server logs for SSE connections
npm run dev
# Look for SSE-related log messages
```

## 🎯 **Next Steps**

1. **Frontend Integration** - Implement EventSource in React components
2. **Error Handling** - Add retry logic and fallback mechanisms
3. **Performance** - Optimize streaming for large responses
4. **Testing** - Add unit tests for SSE endpoints

**SSE endpoints đã sẵn sàng cho real-time Chat Analyze!** 🚀
