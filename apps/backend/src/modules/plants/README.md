# Plants Module

Module quản lý thông tin cây trồng và tích hợp với hệ thống Chat Analyze.

## Features

- CRUD operations cho cây trồng
- Search functionality với text index
- Category filtering
- Integration với analyze service
- Context-aware chat responses

## Endpoints

### GET /api/v1/plants
Lấy danh sách cây trồng với phân trang và lọc.

**Query Parameters:**
- `page` (number, optional): Trang (default: 1)
- `limit` (number, optional): Số lượng/trang (default: 20)
- `category` (string, optional): Lọc theo danh mục
- `search` (string, optional): Tìm kiếm theo tên/mô tả

**Example:**
```bash
GET /api/v1/plants?page=1&limit=10&category=vegetable&search=cà chua
```

### GET /api/v1/plants/search
Tìm kiếm cây trồng theo từ khóa.

**Query Parameters:**
- `q` (string, required): Từ khóa tìm kiếm
- `limit` (number, optional): Số lượng kết quả (default: 10)

**Example:**
```bash
GET /api/v1/plants/search?q=cà chua&limit=5
```

### GET /api/v1/plants/category/:category
Lấy cây trồng theo danh mục.

**Path Parameters:**
- `category` (string, required): Danh mục cây trồng

**Query Parameters:**
- `limit` (number, optional): Số lượng kết quả (default: 20)

### GET /api/v1/plants/:id
Lấy chi tiết cây trồng.

**Path Parameters:**
- `id` (string, required): ID cây trồng

### POST /api/v1/plants
Tạo cây trồng mới (yêu cầu authentication).

**Body:**
```json
{
  "name": "Cà chua",
  "scientificName": "Solanum lycopersicum",
  "description": "Cây cà chua là loại cây trồng phổ biến...",
  "careInstructions": {
    "watering": "Tưới nước 2-3 lần/tuần, tránh úng nước",
    "sunlight": "Cần ánh sáng mặt trời 6-8 giờ/ngày",
    "soil": "Đất tơi xốp, thoát nước tốt, pH 6.0-6.8",
    "temperature": "Nhiệt độ tối ưu 18-25°C"
  },
  "growthStages": [
    {
      "stage": "Gieo hạt",
      "description": "Gieo hạt trong khay ươm",
      "duration": "7-14 ngày"
    }
  ],
  "commonDiseases": [
    {
      "name": "Bệnh đốm lá sớm",
      "symptoms": "Xuất hiện đốm nâu trên lá",
      "treatment": "Phun thuốc trừ nấm, cắt tỉa lá bệnh"
    }
  ],
  "images": [
    {
      "url": "https://example.com/tomato.jpg",
      "caption": "Cây cà chua trưởng thành"
    }
  ],
  "category": "vegetable"
}
```

### PUT /api/v1/plants/:id
Cập nhật cây trồng (yêu cầu authentication).

### DELETE /api/v1/plants/:id
Xóa cây trồng (yêu cầu authentication).

## Categories

- `vegetable`: Rau củ
- `fruit`: Cây ăn quả
- `herb`: Thảo mộc
- `flower`: Hoa
- `tree`: Cây thân gỗ
- `other`: Khác

## Response Format

```json
{
  "success": true,
  "data": {
    "plants": [
      {
        "_id": "plant_id",
        "name": "Cà chua",
        "scientificName": "Solanum lycopersicum",
        "description": "Cây cà chua là loại cây trồng phổ biến...",
        "careInstructions": {
          "watering": "Tưới nước 2-3 lần/tuần",
          "sunlight": "Cần ánh sáng mặt trời 6-8 giờ/ngày",
          "soil": "Đất tơi xốp, thoát nước tốt",
          "temperature": "Nhiệt độ tối ưu 18-25°C"
        },
        "growthStages": [...],
        "commonDiseases": [...],
        "images": [...],
        "category": "vegetable",
        "createdBy": "user_id",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

## Integration

### Analyze Service Integration
Khi Plant.id trả kết quả phân tích, hệ thống sẽ:
1. Tìm kiếm thông tin cây trong database
2. Lấy care instructions, common diseases, growth stages
3. Thêm vào analysis result để cung cấp thông tin chi tiết

### Chat Service Integration
Khi user hỏi về cây trồng, hệ thống sẽ:
1. Phân tích từ khóa trong câu hỏi
2. Tìm kiếm cây trồng phù hợp
3. Tạo response với thông tin chăm sóc chi tiết
4. Cung cấp hướng dẫn bệnh tật và giai đoạn phát triển

## Database Schema

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  scientificName: String (required),
  description: String (required),
  careInstructions: {
    watering: String (required),
    sunlight: String (required),
    soil: String (required),
    temperature: String (required)
  },
  growthStages: [{
    stage: String,
    description: String,
    duration: String
  }],
  commonDiseases: [{
    name: String,
    symptoms: String,
    treatment: String
  }],
  images: [{
    url: String,
    caption: String
  }],
  category: String (enum: ['vegetable', 'fruit', 'herb', 'flower', 'tree', 'other']),
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

- `{ name: 1 }` unique
- `{ category: 1 }`
- `{ name: "text", scientificName: "text", description: "text" }`

## Usage Examples

### Search for plants
```bash
# Search by name
GET /api/v1/plants/search?q=cà chua

# Filter by category
GET /api/v1/plants?category=vegetable

# Combined search and filter
GET /api/v1/plants?search=rau&category=vegetable&page=1&limit=10
```

### Get plant care info for AI
```javascript
// In analyze.service.js
const plantCareInfo = await getPlantCareInfo({ plantName: "cà chua" });
// Returns: { name, scientificName, careInstructions, commonDiseases, growthStages, category }
```

### Chat integration
```javascript
// In chat.service.js
const plantContext = await getPlantCareInfo({ plantName: mentionedPlant });
// Generates contextual response with care instructions
```
