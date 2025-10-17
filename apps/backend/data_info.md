# MongoDB Collections Setup — GreenGrow System

## Database: `greengrow`

---

### 1. users
Stores registered user accounts.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| email | String (unique, lowercase) | User email |
| passwordHash | String | Bcrypt-hashed password |
| name | String / null | Display name |
| role | "user" / "admin" | Account role |
| status | "active" / "blocked" | Account status |
| createdAt | Date | Creation time |
| updatedAt | Date / null | Last update |

Indexes:
- `{ email: 1 }` unique

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
| title | String / null | Session title |
| createdAt | Date | Creation time |
| lastMessageAt | Date | Last message time |
| messagesCount | Int | Total messages |
| meta | Object / null | Extra data |

Indexes:
- `{ sessionId: 1 }` unique
- `{ user: 1, lastMessageAt: -1 }`

---

### 6. chat_messages
Stores all chat messages.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| sessionId | String | FK to chat_sessions |
| user | ObjectId / null | Null if assistant |
| role | "user"/"assistant"/"system" | Message role |
| message | String | Message text (≤8000) |
| attachments | Array / null | Files/images |
| related | Object / null | Related resources (analysisId etc.) |
| meta | Object / null | Model provider metadata |
| createdAt | Date | Creation time |

Indexes:
- `{ sessionId: 1, createdAt: 1 }`
- `{ user: 1, createdAt: -1 }` sparse
- `{ message: "text" }`

---

### 7. analyses
Stores results from Plant.id API for linkage to chat or user history.

| Field | Type | Description |
|--------|------|-------------|
| _id | ObjectId | Primary key |
| user | ObjectId (ref: users) | Owner |
| source | "plantid" | Source identifier |
| inputImages | Array / null | Image URLs or base64 refs |
| resultTop | Object / null | Simplified result |
| raw | Object / null | Full API response |
| createdAt | Date | Creation time |

Indexes:
- `{ user: 1, createdAt: -1 }`

8. plants
---
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

9.product_recommendations
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

10.weather_cache
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
| cachedAt         | Date          | Cache timestamp (TTL) |
| createdAt        | Date          | Creation time         |
| updatedAt        | Date          | Last update           |
