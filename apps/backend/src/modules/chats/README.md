# Chat History Module

Module quản lý lịch sử chat giữa user và assistant với hỗ trợ phân trang, tìm kiếm và quản lý session.

## 🚀 API Endpoints

### Base URL: `/api/v1/chat`

#### 1. Tạo Session Mới
```http
POST /api/v1/chat/sessions/start
```
**Body:** Không cần
**Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "sessionId": "uuid-v4-string"
  }
}
```

#### 2. Gửi Tin Nhắn
```http
POST /api/v1/chat/messages
```
**Body:**
```json
{
  "sessionId": "uuid-v4-string",
  "role": "user",
  "message": "Xin chào, tôi cần tư vấn về cây trồng",
  "meta": {}
}
```
**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "message-id",
    "sessionId": "session-id",
    "role": "user",
    "message": "Xin chào...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 3. Lấy Lịch Sử Chat
```http
GET /api/v1/chat/history?sessionId=uuid&page=1&limit=20&q=keyword&from=2024-01-01&to=2024-01-31
```
**Query Parameters:**
- `sessionId` (required): ID của session
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số item per page (default: 20, max: 100)
- `q` (optional): Từ khóa tìm kiếm
- `from` (optional): Ngày bắt đầu (ISO format)
- `to` (optional): Ngày kết thúc (ISO format)

#### 4. Danh Sách Session
```http
GET /api/v1/chat/sessions?page=1&limit=20
```
**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số item per page (default: 20, max: 100)

**Response (với user đăng nhập):**
```json
{
  "success": true,
  "message": "Sessions listed successfully",
  "data": {
    "sessions": [
      {
        "sessionId": "uuid",
        "lastMessageAt": "2024-01-01T00:00:00.000Z",
        "messagesCount": 10,
        "firstMessage": "Tin nhắn đầu tiên"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### 5. Xóa Session
```http
DELETE /api/v1/chat/sessions/:sessionId
```

#### 6. Xóa Tin Nhắn
```http
DELETE /api/v1/chat/messages/:messageId
```

## 🔐 Authentication

- **Optional Auth**: Có thể sử dụng mà không cần đăng nhập
- **Với user đăng nhập**: Session được liên kết với user
- **Khách**: Chỉ có thể thao tác với session do họ tạo

## 📊 Database Schema

### ChatMessage Collection
```javascript
{
  _id: ObjectId,
  sessionId: String (required, indexed),
  user: ObjectId (optional, ref: 'User'),
  role: String (enum: ['user', 'assistant', 'system']),
  message: String (max: 8000 chars),
  meta: Mixed (optional, for metadata),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ sessionId: 1, createdAt: 1 }`
- `{ user: 1, createdAt: -1 }` (sparse)
- `{ message: 'text' }` (text search)

## 🛠️ Features

### ✅ Đã Implement
- ✅ Tạo và quản lý session
- ✅ Gửi và lưu tin nhắn
- ✅ Lấy lịch sử với phân trang
- ✅ Tìm kiếm theo từ khóa
- ✅ Lọc theo thời gian
- ✅ Danh sách session của user
- ✅ Xóa session và tin nhắn
- ✅ Authentication optional
- ✅ Rate limiting
- ✅ Validation đầy đủ
- ✅ Error handling

### 🚧 TODO (Chưa implement)
- 🔄 Tích hợp LLM service trong `generateAssistantReply()`
- 🔄 WebSocket cho real-time chat
- 🔄 File upload trong tin nhắn
- 🔄 Message encryption
- 🔄 Chat analytics

## 🧪 Testing với Postman

### 1. Tạo Session
```bash
POST http://localhost:3000/api/v1/chat/sessions/start
```

### 2. Gửi Tin Nhắn
```bash
POST http://localhost:3000/api/v1/chat/messages
Content-Type: application/json

{
  "sessionId": "session-id-from-step-1",
  "message": "Hello, I need help with plant care"
}
```

### 3. Lấy Lịch Sử
```bash
GET http://localhost:3000/api/v1/chat/history?sessionId=session-id-from-step-1
```

### 4. Danh Sách Session (với auth)
```bash
GET http://localhost:3000/api/v1/chat/sessions
Authorization: Bearer your-jwt-token
```

## 🔧 Configuration

### Environment Variables
```bash
JWT_SECRET=your-jwt-secret
DB_URI=mongodb://localhost:27017/greengrow
```

### Rate Limiting
- 10 requests per second per IP
- Configurable in `rateLimitMiddleware`

## 📝 Notes

- Module sử dụng ESM (ES Modules)
- Tuân thủ coding style hiện tại của project
- Sẵn sàng tích hợp LLM service
- Hỗ trợ cả user đăng nhập và khách
- Database queries được tối ưu với indexes
