# Plant Boxes Module

Module quản lý các "Plant Box" - hộp quản lý cây trồng với AI care strategy và mini chat bot.

## 📋 Tổng quan

Plant Box là hệ thống quản lý cây trồng thông minh, cho phép user:
- Tạo các box quản lý cây trồng (đang trồng hoặc dự định trồng)
- Tự động generate care strategy dựa trên thời tiết 7 ngày
- Chat với bot về cây trồng (context-aware)
- Thêm notes, images, theo dõi tiến trình

## 🗄️ Database Schema

### PlantBox Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  
  // Basic Info
  name: String,                    // Tên box (user tự đặt)
  plantType: 'existing' | 'planned',
  plantName: String,               // Tên cây
  scientificName: String,
  
  // Timing
  plantedDate: Date,               // Nếu existing
  plannedDate: Date,               // Nếu planned
  expectedHarvestDate: Date,
  
  // Location
  location: {
    name: String,                   // "Vườn sau nhà"
    coordinates: { lat, lon },
    area: Number,                   // m²
    soilType: String,
    sunlight: 'full' | 'partial' | 'shade'
  },
  
  // Plant Details
  quantity: Number,
  growthStage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting',
  currentHealth: 'excellent' | 'good' | 'fair' | 'poor',
  
  // Care Preferences
  careLevel: 'low' | 'medium' | 'high',
  wateringMethod: 'manual' | 'drip' | 'sprinkler',
  fertilizerType: String,
  
  // Additional
  purpose: 'food' | 'ornamental' | 'medicinal' | 'commercial',
  budgetRange: String,
  experienceLevel: 'beginner' | 'intermediate' | 'expert',
  specialRequirements: String,
  companionPlants: [String],
  
  // Notifications
  notifications: {
    enabled: Boolean,
    email: Boolean,
    sms: Boolean,
    frequency: 'daily' | 'weekly' | 'custom',
    customSchedule: [String]
  },
  
  // AI Strategy (auto-generated)
  careStrategy: {
    lastUpdated: Date,
    next7Days: [{
      date: Date,
      actions: [{
        type: 'water' | 'fertilize' | 'prune' | 'check' | 'protect',
        time: String,
        description: String,
        reason: String,
        products: [String]
      }],
      weather: {
        temp: { min, max },
        humidity: Number,
        rain: Number,
        alerts: [String]
      }
    }],
    summary: String
  },
  
  // Images & Notes
  images: [{
    url: String,
    date: Date,
    description: String
  }],
  notes: [{
    date: Date,
    content: String,
    type: 'care' | 'observation' | 'issue' | 'milestone'
  }],
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### 1. Get All Plant Boxes
```http
GET /api/v1/plant-boxes
```

**Query Parameters:**
- `plantType` (optional): `'existing'` | `'planned'`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Plant boxes retrieved successfully",
  "data": {
    "plantBoxes": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

### 2. Get Plant Box by ID
```http
GET /api/v1/plant-boxes/:id
```

### 3. Create Plant Box
```http
POST /api/v1/plant-boxes
```

**Body:**
```json
{
  "name": "Cà chua vườn sau",
  "plantType": "existing",
  "plantName": "Cà chua",
  "scientificName": "Solanum lycopersicum",
  "plantedDate": "2024-01-01",
  "location": {
    "name": "Vườn sau nhà",
    "coordinates": {
      "lat": 21.0285,
      "lon": 105.8542
    },
    "area": 10,
    "soilType": "Đất thịt",
    "sunlight": "full"
  },
  "quantity": 5,
  "growthStage": "vegetative",
  "currentHealth": "good",
  "careLevel": "medium",
  "wateringMethod": "manual"
}
```

**Note:** Nếu `plantType === 'existing'` và có `location.coordinates`, hệ thống sẽ tự động generate care strategy.

### 4. Update Plant Box
```http
PUT /api/v1/plant-boxes/:id
```

**Note:** Nếu update `location`, `plantName`, hoặc `plantType`, hệ thống sẽ tự động regenerate care strategy.

### 5. Delete Plant Box
```http
DELETE /api/v1/plant-boxes/:id
```

Soft delete (set `isActive: false`).

### 6. Refresh Care Strategy
```http
POST /api/v1/plant-boxes/:id/refresh-strategy
```

Force regenerate care strategy với weather data mới nhất.

### 7. Chat with Plant Box (Mini Chat Bot)
```http
POST /api/v1/plant-boxes/:id/chat
```

**Body:**
```json
{
  "message": "Tại sao hôm nay tưới nhiều hơn?"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat response generated successfully",
  "data": {
    "message": "Hôm nay nhiệt độ cao 32°C và độ ẩm thấp 45%, nên cần tưới 500ml nước để đảm bảo cây không bị thiếu nước..."
  }
}
```

**Context:** Bot hiểu context từ:
- Plant info (name, type, growth stage, health)
- Weather 7 days
- Care strategy (actions, reasons)

### 8. Add Note
```http
POST /api/v1/plant-boxes/:id/notes
```

**Body:**
```json
{
  "content": "Đã bón phân NPK hôm nay",
  "type": "care"
}
```

### 9. Add Image
```http
POST /api/v1/plant-boxes/:id/images
```

**Body:**
```json
{
  "url": "https://cloudinary.com/image.jpg",
  "description": "Cây sau 1 tuần"
}
```

## 🤖 AI Care Strategy

### Auto-generation

Care strategy được tự động generate khi:
1. Tạo plant box mới (nếu `plantType === 'existing'` và có coordinates)
2. Update location/plant info
3. User manually refresh

### Strategy Generation Process

1. **Get Weather Data** (7 days forecast)
2. **Build GPT Prompt** với:
   - Plant info
   - Weather forecast
   - User preferences
3. **Parse GPT Response** (JSON format)
4. **Fallback Strategy** nếu GPT fails

### Strategy Format

```javascript
{
  lastUpdated: Date,
  next7Days: [
    {
      date: Date,
      actions: [
        {
          type: 'water',
          time: '08:00',
          description: 'Tưới 500ml nước vào sáng sớm',
          reason: 'Nhiệt độ cao 32°C, độ ẩm thấp 45%',
          products: []
        }
      ],
      weather: {
        temp: { min: 25, max: 32 },
        humidity: 45,
        rain: 0,
        alerts: []
      }
    }
  ],
  summary: 'Tóm tắt chiến lược...'
}
```

## 💬 Mini Chat Bot

### Features

- **Context-aware**: Hiểu plant info + weather + care strategy
- **No history**: Mỗi request độc lập, không lưu chat history
- **Short responses**: Tối đa 150 từ, cụ thể và ngắn gọn

### How It Works

1. User gửi message
2. Backend load:
   - Plant box data
   - Weather data (7 days)
   - Care strategy
3. Build system prompt với tất cả context
4. Call GPT với system prompt + user message
5. Return response

### Example Questions

- "Tại sao hôm nay tưới nhiều hơn?"
- "Có cần bón phân không?"
- "Cây có vẻ yếu, làm sao?"
- "Ngày mai có cần che phủ không?"

## 🔐 Authentication

Tất cả endpoints đều yêu cầu authentication (`authMiddleware`).

## 📝 Notes

- Care strategy được cache trong DB, refresh khi cần
- Weather data được cache 1 giờ
- Chat bot không lưu history (stateless)
- Plant box soft delete (isActive: false)

## 🚀 Future Enhancements

- [ ] Email notifications với care schedule
- [ ] SMS notifications
- [ ] Compare strategies over time
- [ ] Export care report (PDF)
- [ ] Plant timeline view
- [ ] Photo gallery với comparison

