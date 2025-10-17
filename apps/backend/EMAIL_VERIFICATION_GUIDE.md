# Email Verification System - Complete Guide

## 🎯 **Email Verification System Đã Hoàn Thành!**

Hệ thống email verification đã được implement hoàn chỉnh với Gmail SMTP, bao gồm:

### ✅ **Tính Năng Đã Implement**

1. **Email Service** với Gmail SMTP
2. **HTML Email Templates** đẹp mắt
3. **Token-based Verification** với SHA-256 hashing
4. **TTL Indexes** cho auto-cleanup
5. **Rate Limiting** cho resend email
6. **Welcome Email** sau khi verify
7. **Comprehensive Error Handling**

## 🔧 **Cấu Hình Gmail SMTP**

### **Environment Variables (.env)**
```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=chuanbiradi@gmail.com
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
FROM_EMAIL="GreenGrow <chuanbiradi@gmail.com>"

# Application URL
APP_URL=http://localhost:3000
```

### **Gmail App Password Setup**
1. **Enable 2-Factor Authentication** trên Gmail
2. **Generate App Password**:
   - Vào Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Chọn "Mail" và "Other (Custom name)"
   - Copy password và paste vào `SMTP_PASS`

## 📊 **API Endpoints**

### **1. Register User (Updated)**
```bash
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "status": "active",
    "isVerified": false,
    "message": "User created successfully. Please check your email for verification link."
  }
}
```

### **2. Verify Email**
```bash
GET /api/v1/auth/verify-email?token=VERIFICATION_TOKEN&uid=USER_ID
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "john@example.com",
      "name": "John Doe",
      "isVerified": true
    }
  }
}
```

### **3. Resend Verification Email**
```bash
POST /api/v1/auth/verify-email/resend
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "data": {
    "email": "john@example.com"
  }
}
```

## 🔄 **Complete Flow**

### **Step 1: User Registration**
1. User gửi POST `/auth/register`
2. System tạo user với `isVerified=false`
3. Generate raw token (64 hex chars)
4. Hash token với SHA-256
5. Lưu vào `email_verifications` collection
6. Gửi email verification với link

### **Step 2: Email Verification**
1. User click link trong email
2. Link format: `${APP_URL}/verify-email?token=${rawToken}&uid=${userId}`
3. System verify token và update `isVerified=true`
4. Gửi welcome email
5. User có thể login và sử dụng full features

### **Step 3: Resend Email (Optional)**
1. User gửi POST `/auth/verify-email/resend`
2. System check user chưa verify
3. Generate token mới và gửi email mới
4. Rate limit: 1 email per 60 seconds

## 📧 **Email Templates**

### **Verification Email**
- **Subject**: "🌱 Xác thực tài khoản GreenGrow"
- **Content**: HTML template với button và link
- **Expiration**: 24 hours

### **Welcome Email**
- **Subject**: "🎉 Chào mừng đến với GreenGrow!"
- **Content**: Welcome message với features list
- **Trigger**: Sau khi verify thành công

## 🛡️ **Security Features**

### **Token Security**
- **Raw Token**: 64 hex characters (32 bytes)
- **Stored Hash**: SHA-256 hash (không lưu raw token)
- **Expiration**: 24 hours TTL
- **One-time Use**: Token bị invalid sau khi dùng

### **Rate Limiting**
- **Resend Email**: 1 email per 60 seconds
- **All Endpoints**: 100 requests per minute
- **IP-based**: Prevent abuse

### **Database Security**
- **TTL Indexes**: Auto-cleanup expired tokens
- **Unique Constraints**: Prevent duplicate tokens
- **User Isolation**: Users chỉ access được data của mình

## 🧪 **Testing Guide**

### **Test với Postman**

#### **1. Register User**
```bash
POST http://localhost:4000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPass123"
}
```

#### **2. Check Email Inbox**
- Mở Gmail inbox
- Tìm email từ "GreenGrow <chuanbiradi@gmail.com>"
- Click link verification

#### **3. Verify Email**
```bash
GET http://localhost:4000/api/v1/auth/verify-email?token=TOKEN_FROM_EMAIL&uid=USER_ID_FROM_RESPONSE
```

#### **4. Test Resend**
```bash
POST http://localhost:4000/api/v1/auth/verify-email/resend
Content-Type: application/json

{
  "email": "test@example.com"
}
```

### **Test Error Scenarios**

#### **Invalid Token**
```bash
GET http://localhost:4000/api/v1/auth/verify-email?token=invalid&uid=user_id
# Expected: 400 Bad Request
```

#### **Expired Token**
```bash
# Wait 24+ hours or manually expire token
GET http://localhost:4000/api/v1/auth/verify-email?token=expired_token&uid=user_id
# Expected: 400 Bad Request
```

#### **Already Verified User**
```bash
POST http://localhost:4000/api/v1/auth/verify-email/resend
{
  "email": "already_verified@example.com"
}
# Expected: 400 Bad Request
```

## 📈 **Monitoring & Logs**

### **Console Logs**
```bash
✅ SMTP connection verified successfully
✅ Verification email sent to user@example.com
✅ Welcome email sent to user@example.com
❌ Failed to send verification email: Error message
```

### **Database Monitoring**
```javascript
// Check verification records
db.email_verifications.find().pretty()

// Check user verification status
db.users.find({isVerified: false}).count()

// Check expired tokens
db.email_verifications.find({expiresAt: {$lt: new Date()}}).count()
```

## 🚀 **Production Deployment**

### **Environment Setup**
```bash
# Production .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password
FROM_EMAIL="GreenGrow <your-production-email@gmail.com>"
APP_URL=https://your-domain.com
```

### **Security Checklist**
- [ ] **Gmail App Password**: Strong, unique password
- [ ] **HTTPS**: All email links use HTTPS
- [ ] **Rate Limiting**: Appropriate limits for production
- [ ] **Monitoring**: Email delivery monitoring
- [ ] **Backup**: Database backup includes email_verifications

### **Performance Optimization**
- [ ] **Connection Pooling**: Nodemailer connection pooling
- [ ] **Queue System**: Redis/Bull for email queue
- [ ] **Template Caching**: Cache email templates
- [ ] **Database Indexes**: Optimize query performance

## 🎯 **Next Steps**

1. **Test Email Flow**: Register → Check Email → Verify
2. **Configure Gmail**: Set up app password
3. **Test Error Cases**: Invalid tokens, expired tokens
4. **Monitor Logs**: Check console for email delivery
5. **Production Setup**: Configure production environment

---

**Email Verification System** - Hoàn chỉnh và sẵn sàng production! 🚀📧✨
