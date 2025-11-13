# 📊 Database Collections Summary - GreenGrow

## ✅ Collections Hiện Tại (11 collections)

### 1. `users`
- **Purpose**: User accounts & authentication + profile management
- **Model**: `User`
- **Key Fields**: 
  - **Authentication**: email, passwordHash, name, role, status, isVerified, profileImage
  - **Profile**: phone, bio, location (address, province, city, coordinates)
  - **Settings**: emailNotifications, smsNotifications, language, theme, privacy
  - **Stats**: totalPosts, totalComments, totalLikes, totalPlants, joinDate, lastActiveAt
  - **Profiles**: farmerProfile (farmName, farmSize, farmType, crops, experience, certifications), buyerProfile (preferences, budgetRange, purchaseFrequency)

### 2. `auth_tokens`
- **Purpose**: Refresh token storage
- **Model**: `AuthToken`
- **Key Fields**: user, refreshTokenHash, userAgent, ip, expiresAt (TTL)

### 3. `email_verifications`
- **Purpose**: Email verification tokens
- **Model**: `EmailVerification`
- **Key Fields**: user, tokenHash, expiresAt (TTL), used

### 4. `password_resets`
- **Purpose**: Password reset tokens
- **Model**: `PasswordReset`
- **Key Fields**: user, tokenHash, expiresAt (TTL), used

### 5. `chat_sessions`
- **Purpose**: Chat session metadata
- **Model**: `ChatSession`
- **Key Fields**: sessionId (UUID), user, title, lastMessageAt, messagesCount

### 6. `chats`
- **Purpose**: Chat messages storage
- **Model**: `ChatMessage` (⚠️ Model name khác collection name)
- **Key Fields**: sessionId, user, role, message, attachments, analysis, messageType
- **Note**: Collection name là `chats`, không phải `chat_messages`

### 7. `analyses`
- **Purpose**: Plant.id analysis results
- **Model**: `Analysis`
- **Key Fields**: user, source, inputImages, resultTop, raw

### 8. `plants`
- **Purpose**: Plant database
- **Model**: `Plant`
- **Key Fields**: name, scientificName, description, careInstructions, category

### 9. `product_recommendations`
- **Purpose**: Product recommendations
- **Model**: `ProductRecommendation`
- **Key Fields**: name, category, price, imageUrl, externalLinks, tags, plantTypes

### 10. `weather_cache`
- **Purpose**: Weather data cache
- **Model**: `WeatherCache`
- **Key Fields**: location, current, forecast, cachedAt (TTL)

### 11. `admin`
- **Purpose**: Admin settings (if applicable)
- **Note**: Purpose may vary based on implementation

---

## ❌ Collections KHÔNG TỒN TẠI (nhưng có code)

### 1. `posts`
- **Status**: ❌ Code có (`post.model.js`, `post.controller.js`, `post.routes.js`) nhưng chưa được tạo trong MongoDB
- **Location**: `/src/modules/posts/`
- **Note**: Cần tạo collection khi implement Community Platform

### 2. `alerts`
- **Status**: ❌ Code có (`alert.model.js`, `alert.service.js`, `alert.routes.js`) nhưng chưa được tạo trong MongoDB
- **Location**: `/src/modules/alerts/`
- **Note**: Cần tạo collection khi implement Weather SMS Alerts

---

## 📝 Lưu Ý Quan Trọng

1. **Collection Name vs Model Name:**
   - Model `ChatMessage` → Collection `chats`
   - Luôn check `collection` option trong schema để biết collection name thực tế

2. **Collections Cần Tạo:**
   - `posts` - Cho Community Platform (đã có code, chưa migrate)
   - `alerts` - Cho Weather SMS Alerts (đã có code, chưa migrate)

3. **TTL Indexes:**
   - `auth_tokens.expiresAt` - Auto delete expired tokens
   - `email_verifications.expiresAt` - Auto delete expired (24h)
   - `password_resets.expiresAt` - Auto delete expired (1h)
   - `weather_cache.cachedAt` - Auto delete old cache (1h)

---

## 🔍 Verification Commands

### Kiểm tra collections trong MongoDB:
```javascript
use GreenGrow
show collections
```

### Đếm documents trong mỗi collection:
```javascript
db.users.countDocuments()
db.chats.countDocuments()
db.analyses.countDocuments()
db.plants.countDocuments()
db.product_recommendations.countDocuments()
db.weather_cache.countDocuments()
db.chat_sessions.countDocuments()
db.auth_tokens.countDocuments()
db.email_verifications.countDocuments()
db.password_resets.countDocuments()
db.admin.countDocuments()
```

---

---

## 📋 Users Collection Schema Details

### Basic Fields
- `_id`: ObjectId (Primary key)
- `email`: String (unique, lowercase, required)
- `passwordHash`: String (required, select: false)
- `name`: String (required, trim)
- `role`: String (enum: 'user', 'admin', default: 'user')
- `status`: String (enum: 'active', 'blocked', default: 'active')
- `profileImage`: String (default: '')
- `isVerified`: Boolean (default: false)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### Profile Fields (User Profile Management)
- `phone`: String (nullable, trim)
- `bio`: String (nullable, maxlength: 500, trim)
- `location`: Object
  - `address`: String (nullable)
  - `province`: String (nullable)
  - `city`: String (nullable)
  - `coordinates`: Object
    - `lat`: Number (nullable)
    - `lng`: Number (nullable)

### Settings Fields
- `settings`: Object
  - `emailNotifications`: Boolean (default: true)
  - `smsNotifications`: Boolean (default: false)
  - `language`: String (enum: 'vi', 'en', default: 'vi')
  - `theme`: String (enum: 'light', 'dark', default: 'light')
  - `privacy`: Object
    - `profileVisibility`: String (enum: 'public', 'private', 'friends', default: 'public')
    - `showEmail`: Boolean (default: false)
    - `showPhone`: Boolean (default: false)

### Stats Fields
- `stats`: Object
  - `totalPosts`: Number (default: 0)
  - `totalComments`: Number (default: 0)
  - `totalLikes`: Number (default: 0)
  - `totalPlants`: Number (default: 0)
  - `joinDate`: Date (nullable, auto-set from createdAt)
  - `lastActiveAt`: Date (nullable)

### Farmer Profile Fields
- `farmerProfile`: Object
  - `farmName`: String (nullable)
  - `farmSize`: String (nullable)
  - `farmType`: String (nullable)
  - `crops`: Array<String> (default: [])
  - `experience`: String (nullable)
  - `certifications`: Array<String> (default: [])

### Buyer Profile Fields
- `buyerProfile`: Object
  - `preferences`: Array<String> (default: [])
  - `budgetRange`: String (nullable)
  - `purchaseFrequency`: String (nullable)

### Indexes
- `{ email: 1 }` - Unique index
- `{ "farmerProfile.farmType": 1 }` - For filtering farmers
- `{ "stats.totalPosts": -1 }` - For sorting by activity
- `{ "stats.lastActiveAt": -1 }` - For sorting by last activity

---

**Last Updated**: 2025-01-12 (Added User Profile Management fields)
**Database Name**: `GreenGrow` hoặc `greengrow`
**Connection**: `mongodb://127.0.0.1:27017/GreenGrow`

