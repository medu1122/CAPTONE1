# Chat Analyze Module

## 📋 **Tổng quan**

Module Chat Analyze là **AI Layer** chính của hệ thống, tích hợp tất cả các nguồn dữ liệu để xử lý thông minh các tương tác của người dùng.

## 🎯 **Chức năng chính**

### **1. Xử lý đa dạng loại tương tác**

| Loại tương tác     | Quy trình xử lý                                                                                           | Nguồn dữ liệu chính |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ------------------- |
| **Text-only**      | GPT đọc câu hỏi → lấy context từ DB `plants` + `weather` + `products`                                     | GPT + DB            |
| **Image-only**     | Plant.id xác định cây/bệnh → tìm chi tiết trong DB `plants` + sản phẩm phù hợp                            | Plant.id + DB       |
| **Image + Text**   | GPT đọc câu hỏi → quyết định có cần Plant.id không → nếu có ảnh thì phân tích, nếu không chỉ trả lời text | GPT + Plant.id      |
| **Invalid / Spam** | Middleware kiểm tra độ tin cậy → phản hồi lỗi "không hợp lệ"                                              | Validation layer    |

### **2. Tích hợp dữ liệu thông minh**

- **Plant.id** → xác định cây và bệnh
- **DB plants** → mô tả chi tiết, cách chăm sóc
- **DB products** → gợi ý sản phẩm
- **OpenWeather** → thêm điều kiện môi trường
- **GPT** → tạo phản hồi tự nhiên, dễ hiểu

## 🏗️ **Cấu trúc module**

```
chatAnalyze/
├── chatAnalyze.service.js      # Logic xử lý chính
├── chatAnalyze.controller.js   # API endpoints
├── chatAnalyze.validation.js   # Validation schemas
├── chatAnalyze.routes.js       # Route definitions
└── README.md                   # Documentation
```

## 🔧 **API Endpoints**

### **Main Chat Analyze**
```http
POST /api/v1/chat-analyze
Content-Type: application/json

{
  "message": "Cây cà chua của tôi bị bệnh gì?",
  "imageUrl": "https://example.com/image.jpg",
  "weather": {
    "current": {
      "temperature": 25,
      "humidity": 70,
      "description": "Nắng nhẹ"
    }
  }
}
```

### **Text-only Processing**
```http
POST /api/v1/chat-analyze/text
Content-Type: application/json

{
  "message": "Cách chăm sóc cây lan như thế nào?",
  "weather": {
    "current": {
      "temperature": 28,
      "humidity": 80,
      "description": "Mưa nhẹ"
    }
  }
}
```

### **Image-only Processing**
```http
POST /api/v1/chat-analyze/image
Content-Type: application/json

{
  "imageUrl": "https://example.com/plant-image.jpg"
}
```

### **Image + Text Processing**
```http
POST /api/v1/chat-analyze/image-text
Content-Type: application/json

{
  "message": "Cây này bị bệnh gì và cách chữa?",
  "imageUrl": "https://example.com/diseased-plant.jpg"
}
```

### **System Status**
```http
GET /api/v1/chat-analyze/status
```

## 📊 **Response Format**

### **Text-only Response**
```json
{
  "success": true,
  "data": {
    "type": "text-only",
    "response": "Dựa trên thông tin bạn cung cấp...",
    "context": {
      "hasPlantContext": true,
      "hasWeatherContext": true,
      "hasProductContext": true,
      "plantInfo": { ... },
      "weatherInfo": { ... },
      "productInfo": [ ... ]
    },
    "meta": {
      "tokens": 150,
      "model": "gpt-4",
      "processingTime": 1.2
    }
  }
}
```

### **Image-only Response**
```json
{
  "success": true,
  "data": {
    "type": "image-only",
    "analysis": {
      "plant": {
        "commonName": "Cà chua",
        "scientificName": "Solanum lycopersicum"
      },
      "disease": {
        "name": "Bệnh đốm lá sớm",
        "description": "Lá xuất hiện các đốm nâu"
      },
      "confidence": 0.85,
      "plantInfo": { ... },
      "productRecommendations": [ ... ],
      "weatherContext": { ... }
    },
    "context": {
      "hasPlantContext": true,
      "hasProductContext": true,
      "hasWeatherContext": true,
      "confidence": 0.85
    }
  }
}
```

## 🔄 **Processing Flow**

### **1. Text-only Flow**
```
User Message → Extract Keywords → Get Plant Context → Get Weather Context → Get Products → Generate AI Response
```

### **2. Image-only Flow**
```
Image URL → Plant.id Analysis → Get Plant Details → Get Products → Get Weather → Enhanced Analysis
```

### **3. Image + Text Flow**
```
Message + Image → Check if Image Analysis Needed → Plant.id (if needed) → Get Context → Generate AI Response
```

### **4. Invalid/Spam Flow**
```
Message → Spam Detection → Reject with Error Message
```

## 🛡️ **Security & Validation**

### **Input Validation**
- Message: 1-4000 characters
- Image URL: Valid URI format
- Weather: Optional object with temperature, humidity, description

### **Spam Detection**
- Check for spam keywords
- Verify agricultural relevance
- Reject inappropriate content

### **Error Handling**
- Graceful degradation when services fail
- Fallback responses for missing data
- Comprehensive error messages

## 🔗 **Dependencies**

### **Internal Modules**
- `plants/` - Plant knowledge base
- `productRecommendations/` - Product suggestions
- `weather/` - Weather data
- `aiAssistant/` - AI responses

### **External APIs**
- Plant.id API - Plant identification
- OpenAI GPT API - Natural language processing
- OpenWeather API - Weather data

## 📈 **Performance Optimization**

### **Caching Strategy**
- Weather data cached for 1 hour
- Plant information cached in memory
- Product recommendations cached

### **Async Processing**
- Parallel API calls where possible
- Non-blocking database queries
- Efficient error handling

## 🧪 **Testing**

### **Unit Tests**
```bash
# Test individual functions
npm test -- --grep "chatAnalyze"

# Test specific interaction types
npm test -- --grep "text-only"
npm test -- --grep "image-only"
```

### **Integration Tests**
```bash
# Test full workflow
npm test -- --grep "chat-analyze-integration"
```

## 🚀 **Usage Examples**

### **Frontend Integration**
```javascript
// Text-only chat
const response = await fetch('/api/v1/chat-analyze/text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Cách trồng cà chua?'
  })
});

// Image analysis
const response = await fetch('/api/v1/chat-analyze/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/plant.jpg'
  })
});
```

## 🔮 **Future Enhancements**

### **Planned Features**
- [ ] Multi-language support
- [ ] Voice input processing
- [ ] Advanced image analysis
- [ ] Real-time chat streaming
- [ ] Conversation memory
- [ ] Personalized recommendations

### **Performance Improvements**
- [ ] Redis caching
- [ ] Database optimization
- [ ] API rate limiting
- [ ] Response compression

## 📝 **Notes**

- Module này là **AI Layer** chính, tích hợp tất cả các nguồn dữ liệu
- Xử lý thông minh các loại tương tác khác nhau
- Cung cấp context phong phú cho AI responses
- Hỗ trợ graceful degradation khi services fail
