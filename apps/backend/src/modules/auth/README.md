# Enhanced Authentication Module

## 🚀 Hoàn Thiện User/Auth Nền Tảng

Module authentication đã được nâng cấp với refresh token flow, bảo mật tăng cường và validation mạnh mẽ.

## 📋 Tính Năng Đã Hoàn Thiện

### ✅ User Model (`auth.model.js`)
- **Fields mới**: `passwordHash`, `status` (active|blocked)
- **Unique index**: Email được đảm bảo unique
- **Password hashing**: Sử dụng bcrypt với configurable salt rounds
- **Status checking**: Method `isActive()` để kiểm tra trạng thái user

### ✅ Auth Token Model (`authToken.model.js`)
- **Collection**: `auth_tokens` cho refresh tokens
- **Fields**: `user`, `refreshTokenHash`, `userAgent`, `ip`, `expiresAt`
- **TTL Index**: Tự động xóa expired tokens
- **Security**: Refresh token được hash trước khi lưu

### ✅ JWT Utils (`jwt.js`)
- **Access Token**: Ngắn hạn (30 phút mặc định)
- **Refresh Token**: Dài hạn (14 ngày mặc định)
- **Configurable**: Thời gian hết hạn có thể config qua env

### ✅ Auth Service (`auth.service.js`)
- **Register**: Tạo user mới với validation
- **Login**: Trả về access + refresh token
- **Refresh**: Đổi refresh token thành access token mới
- **Logout**: Revoke refresh token
- **Logout All**: Đăng xuất khỏi tất cả thiết bị

### ✅ Auth Controller (`auth.controller.js`)
- **6 Endpoints**: register, login, refresh, logout, logout-all, profile
- **Error Handling**: Xử lý lỗi chi tiết và thân thiện
- **Security**: Track user agent và IP address

### ✅ Auth Validation (`auth.validation.js`)
- **Password**: Tối thiểu 8 ký tự, phải có chữ hoa, chữ thường, số
- **Email**: Format validation và lowercase
- **Name**: 2-50 ký tự
- **Refresh Token**: Validation cho refresh/logout

### ✅ Auth Routes (`auth.routes.js`)
- **Public**: register, login, refresh
- **Protected**: logout, logout-all, profile
- **Rate Limiting**: Áp dụng cho tất cả auth endpoints

### ✅ Enhanced Middleware (`auth.js`)
- **Bearer Token**: Hỗ trợ "Bearer <token>" format
- **Error Messages**: Thông báo lỗi chi tiết và hữu ích
- **Token Expiry**: Xử lý expired token với message rõ ràng

### ✅ Chat Security
- **Bắt buộc Auth**: Tất cả chat routes yêu cầu authentication
- **User Isolation**: Mỗi user chỉ truy cập được session của mình
- **No Guest Access**: Loại bỏ khả năng chat mà không đăng nhập

## 🔧 Environment Configuration

### Required Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRES=1800          # 30 minutes
JWT_REFRESH_EXPIRES_DAYS=14      # 14 days

# Security
BCRYPT_SALT_ROUNDS=10            # Password hashing rounds

# Database
MONGO_URI=mongodb://localhost:27017/greengrow
```

## 📊 API Endpoints

### Authentication Flow
```
1. POST /api/v1/auth/register     → Create account
2. POST /api/v1/auth/login        → Get access + refresh token
3. Use access token for API calls → Bearer <access_token>
4. POST /api/v1/auth/refresh      → Get new access token
5. POST /api/v1/auth/logout       → Revoke refresh token
```

### Request/Response Examples

#### Register
```bash
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "status": "active"
  }
}
```

#### Login
```bash
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 uppercase letter  
- At least 1 number
- No special character requirement (can be added)

### Token Security
- **Access Token**: Short-lived (30 min), stored in memory
- **Refresh Token**: Long-lived (14 days), hashed in database
- **Token Rotation**: New refresh token on each refresh
- **Device Tracking**: Track user agent and IP
- **TTL Cleanup**: Automatic cleanup of expired tokens

### Database Security
- **Unique Email**: Enforced at database level
- **Hashed Passwords**: bcrypt with configurable rounds
- **Hashed Refresh Tokens**: SHA-256 before storage
- **User Status**: Block/unblock capability
- **Audit Trail**: Track login sessions

## 🧪 Testing

### Manual Testing Sequence
1. **Register** → Verify user creation
2. **Login** → Get tokens
3. **Access Protected Route** → Use access token
4. **Refresh Token** → Get new access token
5. **Logout** → Revoke refresh token
6. **Try Expired Token** → Should fail gracefully

### Test Files
- `auth-test-examples.http` - Complete test suite
- Covers all endpoints and error scenarios
- Includes validation testing

## 🚀 Deployment Notes

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set appropriate `JWT_ACCESS_EXPIRES` (recommend 15-30 min)
- [ ] Set appropriate `JWT_REFRESH_EXPIRES_DAYS` (recommend 7-30 days)
- [ ] Increase `BCRYPT_SALT_ROUNDS` (recommend 12-15)
- [ ] Enable database connection
- [ ] Test all auth flows
- [ ] Monitor token usage and cleanup

### Migration Notes
- Existing users will need to re-login to get new token format
- Old tokens will be invalid (by design for security)
- No database migration needed (backward compatible)

## 📈 Performance Considerations

### Database Indexes
- `users.email` - Unique index for fast lookups
- `auth_tokens.user` - Index for user session queries
- `auth_tokens.expiresAt` - TTL index for automatic cleanup
- `auth_tokens.refreshTokenHash` - Unique index for token validation

### Memory Usage
- Access tokens stored in client memory only
- Refresh tokens hashed before database storage
- Automatic cleanup of expired tokens

## 🔮 Future Enhancements

### Planned Features
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Session management dashboard
- [ ] Device management
- [ ] Login attempt limiting
- [ ] Account lockout after failed attempts

### Integration Ready
- [ ] OAuth providers (Google, Facebook, GitHub)
- [ ] LDAP/Active Directory integration
- [ ] Single Sign-On (SSO)
- [ ] Role-based permissions (RBAC)

---

**Enhanced Auth Module** - Bảo mật và hiệu suất cao cho GreenGrow Backend 🔐✨
