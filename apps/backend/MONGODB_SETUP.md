# MongoDB Setup Guide

## ✅ Kết Nối MongoDB Đã Hoàn Thành

### 🔧 Cấu Hình Hiện Tại

**Connection String:** `mongodb://127.0.0.1:27017/GreenGrow`

**Database:** GreenGrow

**Collections đã tạo:**
- ✅ `users` - User accounts
- ✅ `auth_tokens` - Refresh tokens
- ✅ `email_verifications` - Email verification tokens
- ✅ `password_resets` - Password reset tokens
- ✅ `chat_sessions` - Chat session metadata
- ✅ `chat_messages` - Chat messages with attachments
- ✅ `analyses` - Plant analysis results

### 🚀 Cách Sử Dụng

#### 1. **Khởi Động Server**
```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
MONGO_URI="mongodb://127.0.0.1:27017/GreenGrow" npm run dev
```

#### 2. **Test Kết Nối**
```bash
# Test kết nối database
node test-db-connection.js

# Test API server
curl http://localhost:4000/
```

#### 3. **Environment Variables**
Tạo file `.env` trong thư mục backend:
```bash
# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/GreenGrow

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_EXPIRES=1800
JWT_REFRESH_EXPIRES_DAYS=14

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

### 📊 Database Schema

#### **Users Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  role: String (user/admin),
  status: String (active/blocked),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Auth Tokens Collection**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  refreshTokenHash: String (unique),
  userAgent: String,
  ip: String,
  expiresAt: Date (TTL),
  createdAt: Date
}
```

#### **Chat Sessions Collection**
```javascript
{
  _id: ObjectId,
  sessionId: String (UUID v4, unique),
  user: ObjectId (ref: User),
  title: String,
  lastMessageAt: Date,
  messagesCount: Number,
  meta: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### 🔍 Kiểm Tra Kết Nối

#### **1. Test Database Connection**
```bash
node test-db-connection.js
```

#### **2. Test API Endpoints**
```bash
# Health check
curl http://localhost:4000/

# API health
curl http://localhost:4000/api/v1/health
```

#### **3. Test Authentication**
```bash
# Register user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### 🛠️ Troubleshooting

#### **Lỗi Kết Nối MongoDB**
```bash
# Kiểm tra MongoDB có chạy không
brew services list | grep mongodb

# Khởi động MongoDB
brew services start mongodb-community

# Kiểm tra port
lsof -i :27017
```

#### **Lỗi Environment Variables**
```bash
# Kiểm tra biến môi trường
echo $MONGO_URI

# Set biến môi trường
export MONGO_URI="mongodb://127.0.0.1:27017/GreenGrow"
```

#### **Lỗi Port Đã Sử Dụng**
```bash
# Kiểm tra port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### 📈 Monitoring

#### **Database Stats**
```javascript
// Trong MongoDB shell
use GreenGrow
db.stats()
db.users.countDocuments()
db.chat_sessions.countDocuments()
```

#### **API Health**
```bash
curl http://localhost:4000/api/v1/health
```

### 🎯 Next Steps

1. **Tạo User đầu tiên** qua API register
2. **Test Email Verification** workflow
3. **Test Password Reset** workflow
4. **Test Chat Sessions** với attachments
5. **Test Plant Analysis** với images

### 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra MongoDB có chạy: `brew services list | grep mongodb`
2. Kiểm tra port 27017: `lsof -i :27017`
3. Kiểm tra logs: `npm run dev`
4. Test kết nối: `node test-db-connection.js`

---
**✅ MongoDB Connection: ACTIVE**  
**📊 Database: GreenGrow**  
**🔗 Status: Connected**
