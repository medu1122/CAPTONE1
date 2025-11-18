# Analyses Module

Module quản lý lịch sử phân tích cây trồng (My Plants) với hỗ trợ tìm kiếm, lọc và sắp xếp.

## 📋 Tổng quan

Module Analyses lưu trữ kết quả phân tích cây trồng từ Plant.id API và cung cấp API để người dùng xem lại lịch sử phân tích của mình.

## 🚀 API Endpoints

### Base URL: `/api/v1/analyses`

### 1. Get My Plants (Get User Analyses)
```http
GET /api/v1/analyses/my-plants
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, optional): Số trang (default: 1)
- `limit` (number, optional): Số item per page (default: 20, max: 100)
- `status` (string, optional): Lọc theo trạng thái: `all`, `healthy`, `disease`, `warning` (default: `all`)
- `search` (string, optional): Tìm kiếm theo tên cây hoặc tên khoa học
- `sortBy` (string, optional): Sắp xếp: `newest`, `oldest`, `nameAsc`, `nameDesc` (default: `newest`)

**Response:**
```json
{
  "success": true,
  "message": "Analyses retrieved successfully",
  "data": {
    "plants": [
      {
        "id": "analysis_id",
        "name": "Cà chua",
        "scientificName": "Solanum lycopersicum",
        "imageUrl": "https://example.com/image.jpg",
        "status": "disease",
        "confidence": 85,
        "disease": {
          "name": "Bệnh đốm lá sớm",
          "description": "Lá xuất hiện các đốm nâu"
        },
        "analyzedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
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

### 2. Get Analysis by ID
```http
GET /api/v1/analyses/:id
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (string, required): Analysis ID

**Response:**
```json
{
  "success": true,
  "message": "Analysis retrieved successfully",
  "data": {
    "_id": "analysis_id",
    "user": "user_id",
    "source": "plantid",
    "inputImages": [
      {
        "url": "https://example.com/image.jpg",
        "base64": null,
        "metadata": {}
      }
    ],
    "resultTop": {
      "plant": {
        "commonName": "Cà chua",
        "scientificName": "Solanum lycopersicum"
      },
      "confidence": 0.85,
      "summary": "Plant identified with high confidence"
    },
    "raw": {
      "plant": { ... },
      "disease": { ... },
      "isHealthy": false
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Delete Analysis
```http
DELETE /api/v1/analyses/:id
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` (string, required): Analysis ID

**Response:**
```json
{
  "success": true,
  "message": "Analysis deleted successfully",
  "data": {
    "success": true,
    "message": "Analysis deleted successfully"
  }
}
```

## 🔐 Authentication

Tất cả endpoints yêu cầu authentication:
- Header: `Authorization: Bearer <access_token>`
- User chỉ có thể truy cập analyses của chính mình

## 📊 Database Schema

### Analysis Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required, indexed),
  source: String (required, enum: ['plantid', 'manual', 'ai'], default: 'plantid'),
  inputImages: [{
    url: String,
    base64: String,
    metadata: Object
  }],
  resultTop: {
    plant: {
      commonName: String,
      scientificName: String
    },
    confidence: Number,
    summary: String
  },
  raw: Mixed (nullable, full API response),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ user: 1, createdAt: -1 }` - Compound index for efficient user queries

## 🎯 Status Logic

Status được xác định dựa trên:
- **healthy**: Có plant, không có disease, confidence >= 0.7, isHealthy = true
- **disease**: Có disease trong raw data, isHealthy != true
- **warning**: Confidence < 0.7 hoặc isHealthy = false

## 🔄 Integration

### Chat Analyze Integration
Khi user phân tích cây qua Chat Analyze:
1. Analysis được tự động lưu vào database
2. Format đúng với model structure
3. Liên kết với chat message qua `analysisId`

### Frontend Integration
Frontend có thể:
1. Lấy danh sách analyses: `GET /api/v1/analyses/my-plants`
2. Xem chi tiết: `GET /api/v1/analyses/:id`
3. Xóa analysis: `DELETE /api/v1/analyses/:id`

## 🛠️ Features

### ✅ Đã Implement
- ✅ Get user analyses với pagination
- ✅ Filter by status (healthy, disease, warning)
- ✅ Search by plant name
- ✅ Sort by date/name
- ✅ Get analysis by ID
- ✅ Delete analysis
- ✅ Authentication required
- ✅ User ownership validation
- ✅ Validation đầy đủ
- ✅ Error handling

### 🚧 TODO (Chưa implement)
- 🔄 Update analysis
- 🔄 Bulk delete
- 🔄 Export data (CSV/PDF)
- 🔄 Analysis statistics

## 📝 Notes

- Module sử dụng ESM (ES Modules)
- Tuân thủ coding style hiện tại của project
- Analysis được tự động tạo khi user phân tích cây qua Chat Analyze
- Format data đúng với model structure
- Không phá cấu trúc code hiện tại

