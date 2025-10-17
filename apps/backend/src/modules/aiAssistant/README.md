# AI Assistant Module

Module trung gian xử lý AI và GPT API cho hệ thống chat.

## Features

- Tích hợp OpenAI GPT API
- Xử lý context (thời tiết, phân tích cây, sản phẩm)
- Phân tích nhu cầu xử lý ảnh và sản phẩm
- Quản lý conversation với AI

## Endpoints

### POST /api/v1/ai/respond
Tạo phản hồi AI cho cuộc trò chuyện.

**Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Cách chăm sóc cây cà chua?"
    }
  ],
  "weather": {
    "current": {
      "temperature": 25,
      "humidity": 70,
      "description": "nắng"
    }
  },
  "analysis": {
    "plant": {
      "commonName": "Cà chua",
      "scientificName": "Solanum lycopersicum"
    },
    "disease": {
      "name": "Đốm lá",
      "description": "Bệnh đốm lá sớm"
    },
    "confidence": 0.85
  },
  "products": [
    {
      "name": "Phân bón NPK",
      "price": 120000,
      "category": "fertilizer"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Để chăm sóc cây cà chua tốt, bạn cần...",
    "role": "assistant",
    "meta": {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "tokens": {
        "prompt": 150,
        "completion": 200,
        "total": 350
      },
      "finishReason": "stop"
    },
    "context": {
      "hasWeather": true,
      "hasAnalysis": true,
      "hasProducts": true
    }
  }
}
```

### POST /api/v1/ai/analyze-image-need
Phân tích xem có cần xử lý ảnh không.

**Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Cây tôi bị bệnh gì? Tôi sẽ gửi ảnh"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "needsImageAnalysis": true,
    "reason": "Message contains image-related keywords"
  }
}
```

### POST /api/v1/ai/analyze-product-need
Phân tích xem có cần gợi ý sản phẩm không.

**Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Tôi nên mua gì để chữa bệnh này?"
    }
  ],
  "analysis": {
    "plant": {
      "commonName": "Cà chua",
      "scientificName": "Solanum lycopersicum"
    },
    "disease": {
      "name": "Đốm lá",
      "description": "Bệnh đốm lá sớm"
    },
    "confidence": 0.85
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "needsProductRecommendations": true,
    "reason": "Message contains product-related keywords or analysis available"
  }
}
```

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
```

## System Prompt

AI Assistant sử dụng system prompt thông minh với context:

1. **Weather Context**: Thông tin thời tiết hiện tại
2. **Analysis Context**: Kết quả phân tích cây trồng
3. **Product Context**: Sản phẩm đề xuất
4. **Agricultural Knowledge**: Kiến thức nông nghiệp chuyên sâu

## Error Handling

- **401**: Invalid OpenAI API key
- **429**: Rate limit exceeded
- **400**: Invalid request format
- **500**: Internal server error

## Usage Flow

1. **Text-only message**: Gọi GPT với context thời tiết
2. **Image + text**: Gọi Plant.id → GPT với context phân tích
3. **Product request**: Gọi product recommendations → GPT với context sản phẩm
4. **Complex query**: Kết hợp tất cả context
