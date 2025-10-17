# GreenGrow Backend API

## 🌱 Tổng Quan

GreenGrow Backend là một RESTful API được xây dựng bằng Node.js và Express.js, cung cấp các tính năng quản lý cây trồng, phân tích hình ảnh, chat history và cộng đồng nông dân. API được thiết kế theo kiến trúc modular với ESM (ES Modules) và hỗ trợ authentication, file upload, và tích hợp AI.

## 📋 Mục Lục

- [Kiến Trúc](#kiến-trúc)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Middleware](#middleware)
- [Authentication](#authentication)
- [File Upload](#file-upload)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)

## 🏗️ Kiến Trúc

### Cấu Trúc Thư Mục
```
src/
├── app.js                 # Express app configuration
├── server.js             # Server startup
├── routes.js             # Main router
├── config/
│   └── db.js             # Database configuration
├── common/
│   ├── constants.js      # Application constants
│   ├── libs/
│   │   ├── axios.js      # HTTP client configuration
│   │   └── cloudinary.js # Cloud storage (planned)
│   ├── middleware/
│   │   ├── auth.js       # Authentication middleware
│   │   ├── error.js      # Error handling
│   │   ├── rateLimit.js  # Rate limiting
│   │   └── upload.js     # File upload handling
│   └── utils/
│       ├── http.js       # HTTP response helpers
│       └── jwt.js        # JWT utilities
└── modules/
    ├── auth/             # User authentication
    ├── analyze/          # Plant analysis (AI)
    ├── analyses/         # Analysis history
    ├── chats/            # Chat history
    ├── chatSessions/     # Chat session management
    ├── emailVerification/# Email verification
    ├── passwordReset/    # Password reset
    ├── plants/           # Plant management
    ├── posts/            # Community posts
    ├── alerts/           # Weather alerts
    ├── weather/          # Weather data & alerts (NEW)
    ├── productRecommendations/ # Product recommendations (NEW)
    ├── aiAssistant/      # AI Assistant & GPT integration (NEW)
    └── health/           # Health check
```

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer với memory storage
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Monitoring**: Morgan logging
- **External APIs**: OpenAI GPT, OpenWeather, Plant.id
- **AI Integration**: GPT-3.5-turbo, Context-aware responses
- **Weather**: OpenWeather API với caching
- **Content Moderation**: Spam detection, Agricultural relevance

## 🚀 Cài Đặt

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- npm hoặc yarn

### Steps
```bash
# Clone repository
git clone <repository-url>
cd CAPTONE1/apps/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## ⚙️ Cấu Hình

### Environment Variables
```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/greengrow

# JWT
JWT_SECRET=your-super-secret-jwt-key

# External APIs
PLANT_ID_API_KEY=your-plant-id-api-key
OPENAI_API_KEY=your-openai-api-key
OPENWEATHER_API_KEY=your-openweather-api-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# SMS Integration (for alerts)
VIETTEL_SMS_API_URL=your-viettel-sms-api-url
VIETTEL_SMS_API_KEY=your-viettel-sms-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Scripts
```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "build": "echo \"No build step required for backend\""
}
```

## 🔗 API Endpoints

### Base URL
```
http://localhost:4000/api/v1
```

### 1. Authentication (`/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Đăng ký user mới | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/refresh` | Refresh access token | ❌ |
| POST | `/auth/logout` | Đăng xuất | ✅ |
| POST | `/auth/logout-all` | Đăng xuất tất cả thiết bị | ✅ |
| GET | `/auth/profile` | Lấy thông tin profile | ✅ |

### 2. Plant Analysis (`/analyze`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/analyze` | Phân tích cây trồng từ ảnh/text | ❌ |

**Request Format:**
```bash
POST /api/v1/analyze
Content-Type: multipart/form-data

image: <file> (optional, max 5MB, jpg/png/webp)
text: "Mô tả cây trồng" (optional)
lat: 10.762622 (optional)
lon: 106.660172 (optional)
```

**Response Format:**
```json
{
  "plant": {
    "commonName": "Cây Monstera",
    "scientificName": "Monstera deliciosa"
  },
  "disease": {
    "name": "Bệnh đốm lá",
    "description": "Lá xuất hiện các đốm nâu..."
  },
  "confidence": 0.85,
  "care": [
    "Tưới nước khi đất khô 2-3cm trên bề mặt",
    "Đặt cây ở nơi có ánh sáng gián tiếp..."
  ],
  "products": [
    {
      "name": "Phân bón hữu cơ cho cây trồng",
      "imageUrl": "https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=Phân+bón",
      "price": "125.000đ",
      "note": "Phù hợp cho hầu hết các loại cây trồng trong nhà"
    }
  ],
  "imageInsights": {
    "imageUrl": "data:image/jpeg;base64,/9j/4AAQ...",
    "boxes": [
      {
        "top": 25.5,
        "left": 30.2,
        "width": 15.8,
        "height": 12.3,
        "label": "Vùng bệnh đốm lá"
      }
    ]
  }
}
```

### 3. Email Verification (`/email-verification`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/email-verification/create-token` | Tạo verification token | ❌ |
| POST | `/email-verification/verify` | Xác thực email | ❌ |
| GET | `/email-verification/status` | Kiểm tra trạng thái xác thực | ✅ |
| POST | `/email-verification/resend` | Gửi lại email xác thực | ✅ |

### 4. Password Reset (`/password-reset`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/password-reset/request` | Yêu cầu reset password | ❌ |
| POST | `/password-reset/validate-token` | Xác thực reset token | ❌ |
| POST | `/password-reset/reset` | Reset password | ❌ |
| GET | `/password-reset/pending-resets` | Kiểm tra reset đang chờ | ✅ |

### 5. Chat Sessions (`/chat-sessions`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat-sessions` | Tạo session mới | ✅ |
| GET | `/chat-sessions` | Danh sách sessions | ✅ |
| GET | `/chat-sessions/:sessionId` | Chi tiết session | ✅ |
| PUT | `/chat-sessions/:sessionId/title` | Cập nhật tiêu đề | ✅ |
| PUT | `/chat-sessions/:sessionId/meta` | Cập nhật metadata | ✅ |
| DELETE | `/chat-sessions/:sessionId` | Xóa session | ✅ |

### 6. Chat History (`/chat`) - ENHANCED
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat/sessions/start` | Tạo session chat mới | ✅ |
| POST | `/chat/messages` | Gửi tin nhắn (với attachments) | ✅ |
| GET | `/chat/history` | Lấy lịch sử chat | ✅ |
| GET | `/chat/sessions` | Danh sách session | ✅ |
| DELETE | `/chat/sessions/:id` | Xóa session | ✅ |
| DELETE | `/chat/messages/:id` | Xóa tin nhắn | ✅ |

### 7. Plants (`/plants`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/plants` | Lấy danh sách cây | ❌ |
| POST | `/plants` | Tạo cây mới | ✅ |
| GET | `/plants/:id` | Lấy thông tin cây | ❌ |
| PUT | `/plants/:id` | Cập nhật cây | ✅ |
| DELETE | `/plants/:id` | Xóa cây | ✅ |

### 8. Posts (`/posts`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/posts` | Lấy danh sách bài đăng | ❌ |
| POST | `/posts` | Tạo bài đăng mới | ✅ |
| GET | `/posts/:id` | Lấy chi tiết bài đăng | ❌ |
| PUT | `/posts/:id` | Cập nhật bài đăng | ✅ |
| DELETE | `/posts/:id` | Xóa bài đăng | ✅ |

### 9. Alerts (`/alerts`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/alerts` | Lấy danh sách cảnh báo | ✅ |
| POST | `/alerts` | Tạo cảnh báo mới | ✅ |
| PUT | `/alerts/:id` | Cập nhật cảnh báo | ✅ |
| DELETE | `/alerts/:id` | Xóa cảnh báo | ✅ |

### 10. Weather (`/weather`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/weather` | Lấy dữ liệu thời tiết hiện tại và dự báo | ❌ |
| GET | `/weather/alerts` | Lấy cảnh báo thời tiết cho nông nghiệp | ❌ |

### 11. Product Recommendations (`/products`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products/recommendations` | Gợi ý sản phẩm dựa trên cây/bệnh | ❌ |
| GET | `/products/search` | Tìm kiếm sản phẩm theo từ khóa | ❌ |
| GET | `/products/category/:category` | Lấy sản phẩm theo danh mục | ❌ |
| GET | `/products/:productId` | Lấy chi tiết sản phẩm | ❌ |
| POST | `/products` | Tạo sản phẩm mới | ✅ |

### 12. AI Assistant (`/ai`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/ai/respond` | Tạo phản hồi AI cho cuộc trò chuyện | ❌ |
| POST | `/ai/analyze-image-need` | Phân tích nhu cầu xử lý ảnh | ❌ |
| POST | `/ai/analyze-product-need` | Phân tích nhu cầu gợi ý sản phẩm | ❌ |

### 13. Health Check (`/health`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Kiểm tra trạng thái API | ❌ |

## 🗄️ Database Schema

### 1. User Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  passwordHash: String (required, hashed, select: false),
  role: String (enum: ['user', 'admin']),
  status: String (enum: ['active', 'blocked']),
  profileImage: String,
  isVerified: Boolean,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Auth Tokens Collection (NEW)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  refreshTokenHash: String (required, unique),
  userAgent: String,
  ip: String,
  expiresAt: Date (TTL index),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Email Verifications Collection (NEW)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  tokenHash: String (required, unique),
  expiresAt: Date (TTL index, 24 hours),
  createdAt: Date,
  used: Boolean (default: false)
}
```

### 4. Password Resets Collection (NEW)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  tokenHash: String (required, unique),
  expiresAt: Date (TTL index, 1 hour),
  createdAt: Date,
  used: Boolean (default: false)
}
```

### 5. Chat Sessions Collection (NEW)
```javascript
{
  _id: ObjectId,
  sessionId: String (required, unique, UUID v4),
  user: ObjectId (ref: 'User', required),
  title: String (nullable, max 200 chars),
  lastMessageAt: Date (indexed),
  messagesCount: Number (default: 0),
  meta: Object (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Plant Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  scientificName: String (required),
  description: String (required),
  careInstructions: {
    watering: String,
    sunlight: String,
    soil: String,
    temperature: String
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

### 7. Post Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  content: String (required),
  images: [{
    url: String,
    caption: String
  }],
  author: ObjectId (ref: 'User'),
  tags: [String],
  likes: [ObjectId (ref: 'User')],
  comments: [{
    content: String (required),
    author: ObjectId (ref: 'User'),
    createdAt: Date
  }],
  plants: [ObjectId (ref: 'Plant')],
  createdAt: Date,
  updatedAt: Date
}
```

### 8. ChatMessage Collection (ENHANCED)
```javascript
{
  _id: ObjectId,
  sessionId: String (required, indexed),
  user: ObjectId (ref: 'User', required),
  role: String (enum: ['user', 'assistant', 'system']),
  message: String (required, max: 8000),
  attachments: [{
    url: String (required),
    filename: String (required),
    mimeType: String (required),
    size: Number (required)
  }],
  related: {
    analysisId: ObjectId (ref: 'Analysis'),
    plantId: ObjectId (ref: 'Plant'),
    postId: ObjectId (ref: 'Post')
  },
  meta: Mixed (optional),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### 9. Alert Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  phone: String (required),
  location: {
    type: String (enum: ['Point']),
    coordinates: [Number] (required),
    address: String (required)
  },
  plants: [ObjectId (ref: 'Plant')],
  alertTypes: {
    weather: Boolean,
    frost: Boolean,
    drought: Boolean,
    heavyRain: Boolean
  },
  lastSent: Date,
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 10. Analysis Collection (ENHANCED)
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required, indexed),
  source: String (required, enum: ['plantid', 'manual', 'ai']),
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
  raw: Mixed (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

### 11. Weather Cache Collection (NEW)
```javascript
{
  _id: ObjectId,
  location: {
    name: String (required),
    country: String (required),
    coordinates: {
      lat: Number (required),
      lon: Number (required)
    }
  },
  current: {
    temperature: Number (required),
    humidity: Number (required),
    pressure: Number (required),
    description: String (required),
    icon: String (required),
    windSpeed: Number (required),
    windDirection: Number (required)
  },
  forecast: [{
    date: Date (required),
    temperature: {
      min: Number (required),
      max: Number (required)
    },
    humidity: Number (required),
    description: String (required),
    icon: String (required),
    rain: Number (default: 0)
  }],
  cachedAt: Date (TTL index, 1 hour),
  createdAt: Date,
  updatedAt: Date
}
```

### 12. Product Recommendations Collection (NEW)
```javascript
{
  _id: ObjectId,
  name: String (required, max: 200),
  description: String (required, max: 1000),
  category: String (required, enum: ['fertilizer', 'pesticide', 'seed', 'tool', 'soil', 'pot', 'irrigation', 'protection', 'other']),
  subcategory: String (max: 100),
  price: Number (required, min: 0),
  currency: String (enum: ['VND', 'USD'], default: 'VND'),
  imageUrl: String (required, URL validation),
  externalLinks: [{
    platform: String (required, enum: ['shopee', 'tiki', 'lazada', 'sendo', 'other']),
    url: String (required, URL validation),
    price: Number (min: 0),
    availability: String (enum: ['in_stock', 'out_of_stock', 'limited'], default: 'in_stock')
  }],
  tags: [String (lowercase)],
  plantTypes: [String (lowercase)],
  diseaseTypes: [String (lowercase)],
  usageInstructions: String (max: 2000),
  safetyNotes: String (max: 500),
  rating: {
    average: Number (min: 0, max: 5, default: 0),
    count: Number (min: 0, default: 0)
  },
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: 'User', required),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Middleware

### 1. Authentication Middleware
```javascript
// Required authentication
import { authMiddleware } from '../common/middleware/auth.js';

// Optional authentication (for chat, analyze)
import { authOptional } from '../common/middleware/auth.js';
```

### 2. Rate Limiting
```javascript
import { rateLimitMiddleware } from '../common/middleware/rateLimit.js';

// 10 requests per second per IP
```

### 3. File Upload
```javascript
import { uploadImage } from '../common/middleware/upload.js';

// Single image upload
app.post('/upload', uploadImage.single('image'), handler);

// Multiple images
app.post('/upload', uploadImage.array('images', 5), handler);

// Mixed fields
app.post('/upload', uploadImage.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 5 }
]), handler);
```

### 4. Content Moderation (NEW)
```javascript
import { 
  validateTextModeration, 
  validateImageModeration, 
  chatModeration,
  moderationRateLimit 
} from '../common/middleware/moderation.js';

// Text content moderation
app.post('/chat', validateTextModeration, handler);

// Image upload moderation
app.post('/upload', validateImageModeration, handler);

// Combined chat moderation
app.post('/chat', chatModeration, handler);

// Rate limiting for moderation
app.use('/api', moderationRateLimit);
```

### 5. Error Handling
```javascript
import { errorMiddleware } from '../common/middleware/error.js';

// Global error handler
app.use(errorMiddleware);
```

## 🔐 Authentication

### JWT Token Structure
```javascript
{
  id: "user_id",
  email: "user@example.com",
  role: "user",
  iat: 1234567890,
  exp: 1234654290
}
```

### Protected Routes
```javascript
// Add Authorization header
Authorization: Bearer <jwt_token>
```

### Token Generation
```javascript
import { generateToken } from '../common/utils/jwt.js';

const token = generateToken({ 
  id: user._id,
  email: user.email,
  role: user.role 
});
```

## 📁 File Upload

### Supported Formats
- **Images**: JPEG, PNG, WebP
- **Max Size**: 5MB
- **Storage**: Memory (for cloud upload)

### Upload Configuration
```javascript
// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
```

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `413` - Payload Too Large
- `415` - Unsupported Media Type
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway

### Custom Error Helper
```javascript
import { httpError } from '../common/utils/http.js';

// Throw custom error
throw httpError(404, 'Resource not found');

// Success response
const { statusCode, body } = httpSuccess(200, 'Success', data);
res.status(statusCode).json(body);
```

## 🧪 Testing

### Manual Testing với Postman
1. Import collection từ `test-examples.http`
2. Set environment variables
3. Test các endpoints theo thứ tự:
   - Health check
   - Register/Login
   - Protected endpoints
   - File upload

### Test Chat History
```bash
# 1. Tạo session
POST /api/v1/chat/sessions/start

# 2. Gửi tin nhắn
POST /api/v1/chat/messages
{
  "sessionId": "uuid-from-step-1",
  "message": "Hello, I need help with my plant"
}

# 3. Lấy lịch sử
GET /api/v1/chat/history?sessionId=uuid-from-step-1
```

### Test Plant Analysis
```bash
POST /api/v1/analyze
Content-Type: multipart/form-data

image: <upload plant image>
text: "My plant has brown spots on leaves"
```

## 🚀 Deployment

### Environment Setup
```bash
# Production environment
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb://production-db:27017/greengrow
JWT_SECRET=production-secret-key
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start src/server.js --name greengrow-api
pm2 startup
pm2 save
```

## 📊 Monitoring & Logging

### Morgan Logging
```javascript
// Development
app.use(morgan('dev'));

// Production
app.use(morgan('combined'));
```

### Health Check
```bash
GET /api/v1/health
# Response: { "ok": true, "time": "2024-01-01T00:00:00.000Z" }
```

## 🤖 AI & Weather Features

### Weather Integration
- **OpenWeather API**: Lấy dữ liệu thời tiết real-time
- **Weather Caching**: Cache 1 giờ để tối ưu performance
- **Agricultural Alerts**: Cảnh báo sương giá, mưa lớn, hạn hán
- **Context Integration**: Thông tin thời tiết được tích hợp vào AI responses

### AI Assistant
- **GPT-3.5-turbo Integration**: Trợ lý AI thông minh
- **Context-Aware**: Nhận biết thời tiết, phân tích cây, sản phẩm
- **Smart Routing**: Tự động quyết định gọi Plant.id hay chỉ GPT
- **Multi-modal**: Xử lý cả text và image input

### Product Recommendations
- **Smart Matching**: Gợi ý sản phẩm dựa trên cây trồng và bệnh
- **External Links**: Tích hợp Shopee, Tiki, Lazada
- **Category Management**: 9 danh mục sản phẩm chuyên biệt
- **Rating System**: Đánh giá và review sản phẩm

### Content Moderation
- **Agricultural Relevance**: Kiểm tra nội dung liên quan nông nghiệp
- **Spam Detection**: Lọc nội dung spam và không phù hợp
- **Rate Limiting**: Giới hạn request để tránh abuse
- **File Validation**: Kiểm tra định dạng và kích thước file

## 🔮 Roadmap

### Completed Features ✅
- ✅ User authentication (JWT with refresh tokens)
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Chat sessions management
- ✅ Enhanced chat messages (attachments, related)
- ✅ Plant analysis API (mock)
- ✅ Enhanced analysis model
- ✅ Plant management CRUD
- ✅ Community posts
- ✅ Weather alerts system
- ✅ **Weather API integration (OpenWeather)**
- ✅ **Product recommendations system**
- ✅ **AI Assistant with GPT integration**
- ✅ **Content moderation & spam detection**
- ✅ **Weather caching system**
- ✅ **Smart product recommendations**
- ✅ **Context-aware AI responses**
- ✅ File upload handling
- ✅ Rate limiting
- ✅ Error handling
- ✅ Input validation
- ✅ Database optimization (indexes, TTL)

### Planned Features 🚧
- 🔄 Real Plant.id API integration (thay thế mock)
- 🔄 Cloudinary image storage
- 🔄 WebSocket for real-time chat
- 🔄 Email notifications (nodemailer integration)
- 🔄 Push notifications
- 🔄 Analytics dashboard
- 🔄 API documentation (Swagger)
- 🔄 Unit tests
- 🔄 Integration tests
- 🔄 Performance monitoring
- 🔄 Migration scripts for existing data
- 🔄 Advanced AI features (image analysis, disease detection)
- 🔄 Machine learning model training
- 🔄 Multi-language support
- 🔄 Advanced weather forecasting
- 🔄 IoT sensor integration

## 🤝 Contributing

### Development Guidelines
1. Follow ESM import/export syntax
2. Use async/await instead of callbacks
3. Implement proper error handling
4. Add input validation with Joi
5. Write descriptive commit messages
6. Update documentation

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use camelCase for variables
- Use PascalCase for components
- Use UPPER_CASE for constants

## 📞 Support

### Common Issues
1. **Database Connection**: Check MONGO_URI in .env
2. **File Upload**: Verify file size and type
3. **Authentication**: Check JWT_SECRET and token format
4. **Rate Limiting**: Reduce request frequency

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

---

**GreenGrow Backend API** - Công nghệ phục vụ nông nghiệp thông minh 🌱