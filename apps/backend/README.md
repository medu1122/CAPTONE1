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
    ├── chats/            # Chat history (NEW)
    ├── plants/           # Plant management
    ├── posts/            # Community posts
    ├── alerts/           # Weather alerts
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
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

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

### 3. Chat History (`/chat`) - NEW
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat/sessions/start` | Tạo session chat mới | ❌ |
| POST | `/chat/messages` | Gửi tin nhắn | ❌ |
| GET | `/chat/history` | Lấy lịch sử chat | ❌ |
| GET | `/chat/sessions` | Danh sách session | ❌ |
| DELETE | `/chat/sessions/:id` | Xóa session | ❌ |
| DELETE | `/chat/messages/:id` | Xóa tin nhắn | ❌ |

### 4. Plants (`/plants`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/plants` | Lấy danh sách cây | ❌ |
| POST | `/plants` | Tạo cây mới | ✅ |
| GET | `/plants/:id` | Lấy thông tin cây | ❌ |
| PUT | `/plants/:id` | Cập nhật cây | ✅ |
| DELETE | `/plants/:id` | Xóa cây | ✅ |

### 5. Posts (`/posts`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/posts` | Lấy danh sách bài đăng | ❌ |
| POST | `/posts` | Tạo bài đăng mới | ✅ |
| GET | `/posts/:id` | Lấy chi tiết bài đăng | ❌ |
| PUT | `/posts/:id` | Cập nhật bài đăng | ✅ |
| DELETE | `/posts/:id` | Xóa bài đăng | ✅ |

### 6. Alerts (`/alerts`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/alerts` | Lấy danh sách cảnh báo | ✅ |
| POST | `/alerts` | Tạo cảnh báo mới | ✅ |
| PUT | `/alerts/:id` | Cập nhật cảnh báo | ✅ |
| DELETE | `/alerts/:id` | Xóa cảnh báo | ✅ |

### 7. Health Check (`/health`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Kiểm tra trạng thái API | ❌ |

## 🗄️ Database Schema

### 1. User Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin']),
  profileImage: String,
  isVerified: Boolean,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Plant Collection
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

### 3. Post Collection
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

### 4. ChatMessage Collection (NEW)
```javascript
{
  _id: ObjectId,
  sessionId: String (required, indexed),
  user: ObjectId (ref: 'User', optional),
  role: String (enum: ['user', 'assistant', 'system']),
  message: String (required, max: 8000),
  meta: Mixed (optional),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### 5. Alert Collection
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

### 6. Analysis Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  image: {
    url: String,
    publicId: String
  },
  query: {
    text: String,
    imageBase64: String
  },
  result: {
    plantIdentification: {
      isPlant: Boolean,
      probability: Number,
      suggestions: [{
        id: String,
        name: String,
        commonNames: [String],
        scientificName: String,
        probability: Number,
        details: {
          wikiDescription: String,
          taxonomy: Object,
          url: String
        }
      }]
    },
    healthAssessment: {
      isHealthy: Boolean,
      diseases: [{
        name: String,
        probability: Number,
        description: String,
        treatment: String
      }]
    },
    careInstructions: {
      watering: String,
      sunlight: String,
      soil: String,
      fertilizer: String,
      pruning: String
    },
    products: [{
      name: String,
      description: String,
      category: String,
      price: Number,
      url: String,
      imageUrl: String
    }]
  },
  status: String (enum: ['pending', 'completed', 'failed']),
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

### 4. Error Handling
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

## 🔮 Roadmap

### Completed Features ✅
- ✅ User authentication (JWT)
- ✅ Plant analysis API (mock)
- ✅ Chat history system
- ✅ Plant management CRUD
- ✅ Community posts
- ✅ Weather alerts system
- ✅ File upload handling
- ✅ Rate limiting
- ✅ Error handling
- ✅ Input validation

### Planned Features 🚧
- 🔄 Real AI integration (Plant.id API)
- 🔄 Cloudinary image storage
- 🔄 WebSocket for real-time chat
- 🔄 Email notifications
- 🔄 Push notifications
- 🔄 Analytics dashboard
- 🔄 API documentation (Swagger)
- 🔄 Unit tests
- 🔄 Integration tests
- 🔄 Performance monitoring

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