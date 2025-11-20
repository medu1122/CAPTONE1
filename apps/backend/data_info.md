# MongoDB Collections Setup — GreenGrow System

## Database: `greengrow`

---

### 1. users
Stores registered user accounts and profile management.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| email | String (unique, lowercase) | User email |
| passwordHash | String | Bcrypt-hashed password |
| name | String | Display name (required) |
| role | "user" / "admin" | Account role (default: "user") |
| status | "active" / "blocked" | Account status (default: "active") |
| profileImage | String | Profile image URL (default: "") |
| isVerified | Boolean | Email verified status (default: false) |
| phone | String / null | Phone number |
| bio | String / null | User bio (max: 500 chars) |
| location | Object / null | Location information |
| ├─ address | String / null | Street address |
| ├─ province | String / null | Province |
| ├─ city | String / null | City |
| └─ coordinates | Object / null | GPS coordinates |
| │  ├─ lat | Number / null | Latitude |
| │  └─ lng | Number / null | Longitude |
| settings | Object | User settings |
| ├─ emailNotifications | Boolean | Email notifications (default: true) |
| ├─ smsNotifications | Boolean | SMS notifications (default: false) |
| ├─ language | "vi" / "en" | Language preference (default: "vi") |
| ├─ theme | "light" / "dark" | UI theme (default: "light") |
| └─ privacy | Object | Privacy settings |
| │  ├─ profileVisibility | "public" / "private" / "friends" | Visibility (default: "public") |
| │  ├─ showEmail | Boolean | Show email (default: false) |
| │  └─ showPhone | Boolean | Show phone (default: false) |
| stats | Object | User statistics |
| ├─ totalPosts | Number | Total posts (default: 0) |
| ├─ totalComments | Number | Total comments (default: 0) |
| ├─ totalLikes | Number | Total likes received (default: 0) |
| ├─ totalPlants | Number | Total plants (default: 0) |
| ├─ joinDate | Date / null | Join date (auto-set from createdAt) |
| └─ lastActiveAt | Date / null | Last active timestamp |
| farmerProfile | Object / null | Farmer profile |
| ├─ farmName | String / null | Farm name |
| ├─ farmSize | String / null | Farm size |
| ├─ farmType | String / null | Farm type |
| ├─ crops | Array<String> | Crops list (default: []) |
| ├─ experience | String / null | Experience description |
| └─ certifications | Array<String> | Certifications (default: []) |
| buyerProfile | Object / null | Buyer profile |
| ├─ preferences | Array<String> | Preferences (default: []) |
| ├─ budgetRange | String / null | Budget range |
| └─ purchaseFrequency | String / null | Purchase frequency |
| resetPasswordToken | String / null | Password reset token |
| resetPasswordExpire | Date / null | Password reset expiration |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ email: 1 }` unique
- `{ "farmerProfile.farmType": 1 }` - For filtering farmers
- `{ "stats.totalPosts": -1 }` - For sorting by activity
- `{ "stats.lastActiveAt": -1 }` - For sorting by last activity

---

### 2. auth_tokens
Refresh token storage for session management.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId (ref: users) | Linked user |
| refreshTokenHash | String | Hashed refresh token |
| userAgent | String / null | Device info |
| ip | String / null | IP address |
| expiresAt | Date | Expiration time |
| createdAt | Date | Creation time |

Indexes:
- `{ user: 1, expiresAt: 1 }`
- `{ expiresAt: 1 }` TTL

---

### 3. email_verifications
Used to verify user email after registration.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId (ref: users) | Linked user |
| tokenHash | String | Hashed verification token |
| expiresAt | Date | Expiration time |
| createdAt | Date | Creation time |
| used | Boolean | Whether verified |

Indexes:
- `{ user: 1 }`
- `{ expiresAt: 1 }` TTL

---

### 4. password_resets
Handles password reset requests.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId (ref: users) | Linked user |
| tokenHash | String | Hashed reset token |
| expiresAt | Date | Expiration time |
| createdAt | Date | Creation time |
| used | Boolean | Whether used |

Indexes:
- `{ user: 1 }`
- `{ expiresAt: 1 }` TTL

---

### 5. chat_sessions
Stores chat session headers per user.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| sessionId | String (UUID v4) | Unique session ID |
| user | ObjectId (ref: users) | Owner |
| title | String / null | Session title (max: 200 chars) |
| lastAnalysis | ObjectId / null | Last analysis reference (ref: analyses) |
| lastMessageAt | Date | Last message time |
| messagesCount | Number | Total messages (default: 0) |
| meta | Object | Extra data (default: {}) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ sessionId: 1 }` unique
- `{ user: 1, lastMessageAt: -1 }`
- `{ title: "text" }` - Text search
- `{ lastAnalysis: 1 }` sparse

---

### 6. chats
**Note:** Model name is `ChatMessage` but collection name is `chats`

Stores all chat messages.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| sessionId | String | FK to chat_sessions (required, indexed) |
| user | ObjectId / null | User reference (ref: users, null for assistant) |
| role | "user"/"assistant"/"system" | Message role (required) |
| message | String | Message text (required, max: 8000 chars) |
| attachments | Array | Files/images (default: []) |
| ├─ url | String | Attachment URL |
| ├─ filename | String | Filename |
| ├─ mimeType | String | MIME type |
| └─ size | Number | File size |
| related | Object / null | Related resources |
| ├─ analysisId | ObjectId / null | Analysis reference |
| ├─ plantId | ObjectId / null | Plant reference |
| └─ postId | ObjectId / null | Post reference |
| analysis | ObjectId / null | Link to analysis result (ref: analyses, sparse indexed) |
| messageType | String | Message type (enum: "text", "image", "image-text", "analysis", default: "text") |
| meta | Object | Model provider metadata (default: {}) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ sessionId: 1, createdAt: 1 }`
- `{ user: 1, createdAt: -1 }` sparse
- `{ sessionId: 1, user: 1 }` sparse
- `{ sessionId: 1, analysis: 1 }` sparse
- `{ messageType: 1 }`
- `{ message: "text" }` - Text search

---

### 7. analyses
Stores results from Plant.id API for linkage to chat or user history.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId (ref: users) | Owner (required, indexed) |
| source | String | Source identifier (enum: "plantid", "manual", "ai", default: "plantid") |
| inputImages | Array | Image URLs or base64 refs (default: []) |
| ├─ url | String | Image URL |
| ├─ base64 | String | Base64 image |
| └─ metadata | Object | Image metadata |
| resultTop | Object / null | Simplified result |
| ├─ plant | Object | Plant information |
| │  ├─ commonName | String | Common name |
| │  └─ scientificName | String | Scientific name |
| ├─ confidence | Number | Confidence score |
| └─ summary | String | Summary |
| raw | Object / null | Full API response |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ user: 1, createdAt: -1 }`

### 8. plants
| Field            | Type                  | Description                                                  |
| ---------------- | --------------------- | ------------------------------------------------------------ |
| _id              | ObjectId              | Primary key                                                  |
| name             | String                | Plant name (e.g. "Cà chua", "Lan Hồ Điệp")                   |
| scientificName   | String                | Scientific name                                              |
| description      | String                | Plant description                                            |
| careInstructions | Object                | Detailed care instructions                                   |
| ├─ watering      | String                | Watering instructions                                        |
| ├─ sunlight      | String                | Sunlight requirements                                        |
| ├─ soil          | String                | Soil type recommendations                                    |
| └─ temperature   | String                | Temperature requirements                                     |
| growthStages     | Array<Object>         | Plant growth stages                                          |
| ├─ stage         | String                | Stage name                                                   |
| ├─ description   | String                | Stage description                                            |
| └─ duration      | String                | Stage duration                                               |
| commonDiseases   | Array<Object>         | Common diseases                                              |
| ├─ name          | String                | Disease name                                                 |
| ├─ symptoms      | String                | Disease symptoms                                             |
| └─ treatment     | String                | Treatment methods                                            |
| images           | Array<Object>         | Plant images                                                 |
| ├─ url           | String                | Image URL                                                    |
| └─ caption       | String                | Image caption                                                |
| category         | String                | Plant category (vegetable, fruit, herb, flower, tree, other) |
| createdBy        | ObjectId (ref: users) | Creator                                                      |
| createdAt        | Date                  | Creation time                                                |
| updatedAt        | Date                  | Last update                                                  |

Indexes:
- `{ name: "text", scientificName: "text", description: "text" }` - Text search
- `{ category: 1 }`
- `{ createdBy: 1 }`

---

### 9. product_recommendations
| Field             | Type                  | Description                                                                                    |
| ----------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| _id               | ObjectId              | Primary key                                                                                    |
| name              | String                | Product name                                                                                   |
| description       | String                | Product description                                                                            |
| category          | String                | Product category (fertilizer, pesticide, seed, tool, soil, pot, irrigation, protection, other) |
| subcategory       | String                | Product subcategory                                                                            |
| price             | Number                | Product price                                                                                  |
| currency          | String                | Currency (VND, USD)                                                                            |
| imageUrl          | String                | Product image URL                                                                              |
| externalLinks     | Array<Object>         | External purchase links                                                                        |
| ├─ platform       | String                | shopee, tiki, lazada, sendo, other                                                             |
| ├─ url            | String                | Purchase URL                                                                                   |
| ├─ price          | Number                | Platform price                                                                                 |
| └─ availability   | String                | Stock status                                                                                   |
| tags              | Array<String>         | Product tags                                                                                   |
| plantTypes        | Array<String>         | Related plant types                                                                            |
| diseaseTypes      | Array<String>         | Related disease types                                                                          |
| usageInstructions | String                | Usage instructions                                                                             |
| safetyNotes       | String                | Safety information                                                                             |
| rating            | Object                | Product ratings                                                                                |
| ├─ average        | Number                | Average rating (0–5)                                                                           |
| └─ count          | Number                | Number of ratings                                                                              |
| isActive          | Boolean               | Product status                                                                                 |
| createdBy         | ObjectId (ref: users) | Creator                                                                                        |
| createdAt         | Date                  | Creation time                                                                                  |
| updatedAt         | Date                  | Last update                                                                                    |

Indexes:
- `{ category: 1, isActive: 1 }`
- `{ plantTypes: 1, isActive: 1 }`
- `{ diseaseTypes: 1, isActive: 1 }`
- `{ tags: 1, isActive: 1 }`
- `{ "rating.average": -1, "rating.count": -1 }`
- `{ price: 1, isActive: 1 }`
- `{ name: "text", description: "text", tags: "text", plantTypes: "text" }` - Text search

---

### 10. weather_cache
| Field            | Type          | Description           |
| ---------------- | ------------- | --------------------- |
| _id              | ObjectId      | Primary key           |
| location         | Object        | Location information  |
| ├─ name          | String        | Location name         |
| ├─ country       | String        | Country code          |
| └─ coordinates   | Object        | GPS coordinates       |
| │  ├─ lat        | Number        | Latitude              |
| │  └─ lon        | Number        | Longitude             |
| current          | Object        | Current weather       |
| ├─ temperature   | Number        | °C                    |
| ├─ humidity      | Number        | %                     |
| ├─ pressure      | Number        | hPa                   |
| ├─ description   | String        | Weather description   |
| ├─ icon          | String        | Icon code             |
| ├─ windSpeed     | Number        | m/s                   |
| └─ windDirection | Number        | Degrees               |
| forecast         | Array<Object> | 5-day forecast        |
| ├─ date          | Date          | Forecast date         |
| ├─ temperature   | Object        | Temperature range     |
| │  ├─ min        | Number        | Min °C                |
| │  └─ max        | Number        | Max °C                |
| ├─ humidity      | Number        | %                     |
| ├─ description   | String        | Weather description   |
| ├─ icon          | String        | Icon code             |
| └─ rain          | Number        | Rainfall (mm)         |
| cachedAt         | Date          | Cache timestamp (TTL, expires: 3600s) |
| createdAt        | Date          | Creation time         |
| updatedAt        | Date          | Last update           |

Indexes:
- `{ "location.coordinates.lat": 1, "location.coordinates.lon": 1 }`
- `{ "location.name": 1 }`
- `{ cachedAt: 1 }` TTL (expires after 3600 seconds)

---

### 11. plant_boxes
Stores user's plant management boxes (Plant Box System) for tracking individual plants with AI-generated care strategies.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId (ref: users) | Owner (required, indexed) |
| name | String | Box name (required, max: 100 chars, trimmed) |
| plantType | String | Plant type (enum: "existing", "planned", required) |
| plantName | String | Plant name (required, trimmed) |
| scientificName | String / null | Scientific name |
| plantedDate | Date / null | Planting date (if existing) |
| plannedDate | Date / null | Planned planting date (if planned) |
| expectedHarvestDate | Date / null | Expected harvest date |
| location | Object | Location information (required) |
| ├─ name | String | Location name (required) |
| ├─ coordinates | Object / null | GPS coordinates |
| │  ├─ lat | Number / null | Latitude |
| │  └─ lon | Number / null | Longitude |
| ├─ area | Number / null | Area in m² |
| ├─ soilType | String / null | Soil type |
| └─ sunlight | String | Sunlight level (enum: "full", "partial", "shade") |
| quantity | Number | Plant quantity (min: 1, default: 1) |
| growthStage | String / null | Growth stage (enum: "seed", "seedling", "vegetative", "flowering", "fruiting") |
| currentHealth | String / null | Current health status (enum: "excellent", "good", "fair", "poor") |
| careLevel | String | Care level (enum: "low", "medium", "high", default: "medium") |
| wateringMethod | String | Watering method (enum: "manual", "drip", "sprinkler", default: "manual") |
| fertilizerType | String / null | Fertilizer type |
| purpose | String / null | Plant purpose (enum: "food", "ornamental", "medicinal", "commercial") |
| budgetRange | String / null | Budget range |
| experienceLevel | String / null | Experience level (enum: "beginner", "intermediate", "expert") |
| specialRequirements | String / null | Special requirements |
| companionPlants | Array<String> | Companion plants list (default: []) |
| notifications | Object | Notification settings |
| ├─ enabled | Boolean | Notifications enabled (default: true) |
| ├─ email | Boolean | Email notifications (default: true) |
| ├─ sms | Boolean | SMS notifications (default: false) |
| ├─ frequency | String | Notification frequency (enum: "daily", "weekly", "custom", default: "daily") |
| └─ customSchedule | Array<String> | Custom schedule times (default: []) |
| careStrategy | Object / null | AI-generated care strategy |
| ├─ lastUpdated | Date | Last strategy update (default: Date.now) |
| ├─ next7Days | Array<Object> | 7-day care strategy |
| │  ├─ date | Date | Strategy date (required) |
| │  ├─ actions | Array<Object> | Care actions for the day |
| │  │  ├─ type | String | Action type (enum: "water", "fertilize", "prune", "check", "protect", required) |
| │  │  ├─ time | String | Action time (e.g., "08:00") |
| │  │  ├─ description | String | Action description |
| │  │  ├─ reason | String | Action reason |
| │  │  └─ products | Array<String> | Recommended products |
| │  └─ weather | Object | Weather data for the day |
| │     ├─ temp | Object | Temperature range |
| │     │  ├─ min | Number | Min temperature |
| │     │  └─ max | Number | Max temperature |
| │     ├─ humidity | Number | Humidity percentage |
| │     ├─ rain | Number | Rainfall (mm) |
| │     └─ alerts | Array<String> | Weather alerts |
| └─ summary | String | Strategy summary |
| images | Array<Object> | Plant images (default: []) |
| ├─ url | String | Image URL |
| ├─ date | Date | Image date (default: Date.now) |
| └─ description | String / null | Image description |
| notes | Array<Object> | Plant notes (default: []) |
| ├─ date | Date | Note date (default: Date.now) |
| ├─ content | String | Note content |
| └─ type | String | Note type (enum: "care", "observation", "issue", "milestone", default: "observation") |
| isActive | Boolean | Active status (default: true) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ user: 1, createdAt: -1 }` - For user's plant boxes sorted by creation date
- `{ user: 1, plantType: 1 }` - For filtering by plant type per user
- `{ user: 1, isActive: 1 }` - For filtering active boxes per user
- `{ "location.coordinates.lat": 1, "location.coordinates.lon": 1 }` - For geospatial queries
- `{ name: "text", plantName: "text", scientificName: "text" }` - Text search

---

### 12. posts
**Note:** Code exists but collection may not be created in MongoDB yet.

Stores community posts and discussions.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| title | String | Post title (required) |
| content | String | Post content (required) |
| images | Array | Post images (default: []) |
| ├─ url | String | Image URL |
| └─ caption | String | Image caption |
| author | ObjectId | Author (ref: users, required) |
| tags | Array<String> | Tags (default: []) |
| likes | Array<ObjectId> | User likes (ref: users, default: []) |
| comments | Array | Comments (embedded) |
| ├─ content | String | Comment content (required) |
| ├─ author | ObjectId | Author (ref: users, required) |
| ├─ parentComment | ObjectId / null | Parent comment for replies (ref: Comment) |
| ├─ createdAt | Date | Creation time |
| └─ updatedAt | Date | Last update |
| plants | Array<ObjectId> | Related plants (ref: plants, default: []) |
| category | String | Post category (enum: "question", "discussion", "tip", "problem", "success", "other", default: "discussion") |
| status | String | Post status (enum: "draft", "pending", "published", "rejected", "archived", default: "published") |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ title: "text", content: "text", tags: "text" }` - Text search
- `{ author: 1, createdAt: -1 }`
- `{ category: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`
- `{ createdAt: -1 }`

---

### 13. alerts
**Note:** Code exists but collection may not be created in MongoDB yet.

Stores weather and plant alerts for SMS notifications.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId | User (ref: users, required) |
| phone | String | Phone number (required) |
| location | Object | Location (GeoJSON Point) |
| ├─ type | String | GeoJSON type (enum: "Point", default: "Point") |
| ├─ coordinates | Array<Number> | [longitude, latitude] (required) |
| └─ address | String | Address (required) |
| plants | Array<ObjectId> | Monitored plants (ref: plants, default: []) |
| alertTypes | Object | Alert type preferences |
| ├─ weather | Boolean | Weather alerts (default: true) |
| ├─ frost | Boolean | Frost alerts (default: true) |
| ├─ drought | Boolean | Drought alerts (default: true) |
| └─ heavyRain | Boolean | Heavy rain alerts (default: true) |
| lastSent | Date / null | Last alert sent time |
| active | Boolean | Alert active status (default: true) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ "location.coordinates": "2dsphere" }` - Geospatial index
- `{ user: 1 }`
- `{ active: 1 }`

---

### 14. products
**Note:** Collection stores chemical treatment products imported from Google Sheets.

Stores chemical treatment products (thuốc hóa học) for plant disease treatment.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| name | String | Product name (required, indexed) |
| activeIngredient | String | Active ingredient (required) |
| manufacturer | String | Manufacturer name (required) |
| targetDiseases | Array<String> | Diseases this product treats (required) |
| targetCrops | Array<String> | Crops this product is for (required) |
| dosage | String | Dosage instructions (required) |
| usage | String | Usage instructions (required) |
| price | String | Product price (optional) |
| imageUrl | String | Product image URL (optional) |
| source | String | Data source (required) |
| verified | Boolean | Verification status (default: false) |
| frequency | String | Application frequency (optional) |
| isolationPeriod | String | Days before harvest (optional) |
| precautions | Array<String> | Safety precautions (optional) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ name: "text", activeIngredient: "text" }` - Text search
- `{ verified: 1 }` - For filtering verified products

---

### 15. biological_methods
**Note:** Collection stores biological treatment methods imported from Google Sheets.

Stores biological treatment methods (phương pháp sinh học) for plant disease treatment.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| name | String | Method name (required, indexed) |
| targetDiseases | Array<String> | Diseases this method treats (required) |
| materials | String | Required materials (required) |
| steps | String | Step-by-step instructions (required) |
| timeframe | String | Treatment timeframe (required) |
| effectiveness | String | Effectiveness description (required) |
| source | String | Data source (required) |
| verified | Boolean | Verification status (default: false) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ name: "text", materials: "text" }` - Text search
- `{ verified: 1 }` - For filtering verified methods

---

### 16. cultural_practices
**Note:** Collection stores cultural practices imported from Google Sheets.

Stores cultural practices (biện pháp canh tác) for plant care and disease prevention.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| category | String | Practice category (required, enum: 'soil', 'water', 'fertilizer', 'light', 'spacing', indexed) |
| action | String | Action name (required) |
| description | String | Detailed description (required) |
| priority | String | Priority level (required, enum: 'High', 'Medium', 'Low', default: 'Medium') |
| applicableTo | Array<String> | Applicable crops (required) |
| source | String | Data source (required) |
| verified | Boolean | Verification status (default: false) |
| createdAt | Date | Creation time |
| updatedAt | Date | Last update |

Indexes:
- `{ category: 1, priority: 1 }` - For filtering by category and priority
- `{ action: "text", description: "text" }` - Text search
- `{ verified: 1 }` - For filtering verified practices

---

## 📝 Notes

1. **Collection Names:**
   - Model `ChatMessage` → Collection `chats` (not `chat_messages`)
   - Always check `collection` option in schema for actual collection name

2. **Collections Status:**
   - ✅ **Created in MongoDB:** users, auth_tokens, email_verifications, password_resets, chat_sessions, chats, analyses, plants, product_recommendations, weather_cache, plant_boxes, products, biological_methods, cultural_practices
   - ⚠️ **Code exists, may need migration:** posts, alerts

3. **TTL Indexes (Auto-delete expired documents):**
   - `auth_tokens.expiresAt` - Auto delete expired tokens
   - `email_verifications.expiresAt` - Auto delete expired (24h)
   - `password_resets.expiresAt` - Auto delete expired (1h)
   - `weather_cache.cachedAt` - Auto delete old cache (1h)

4. **Database Name:**
   - `GreenGrow` or `greengrow`
   - Connection: `mongodb://127.0.0.1:27017/GreenGrow`

**Last Updated:** 2025-01-21 (Added Treatment collections: products, biological_methods, cultural_practices for plant disease treatment system)
