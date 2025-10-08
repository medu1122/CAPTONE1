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

---

### Notes
- TTL indexes automatically remove expired documents based on `expiresAt`.
- `createdAt` / `updatedAt` fields should be managed by backend logic.
- All sensitive data (passwordHash, refreshTokenHash, tokenHash) must be hashed.
- Access control and validation are handled via middleware in backend code.
