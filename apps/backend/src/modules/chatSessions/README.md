# Chat Sessions Module

## Overview
This module manages chat session metadata separately from chat messages for better performance and organization.

## Features
- Create and manage chat sessions
- Session title management
- Session metadata storage
- Message count tracking
- Last message timestamp tracking
- Session search functionality
- Pagination support

## API Endpoints

### POST /api/chat-sessions
Create a new chat session.

**Request Body:**
```json
{
  "title": "My Plant Chat",
  "meta": {
    "plantType": "indoor",
    "difficulty": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "My Plant Chat",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "meta": {
      "plantType": "indoor",
      "difficulty": "beginner"
    }
  }
}
```

### GET /api/chat-sessions
Get user sessions with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search term for session titles

**Response:**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "sessionId": "123e4567-e89b-12d3-a456-426614174000",
        "title": "My Plant Chat",
        "lastMessageAt": "2024-01-01T14:30:00.000Z",
        "messagesCount": 15,
        "meta": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /api/chat-sessions/:sessionId
Get specific session details.

**Response:**
```json
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "My Plant Chat",
    "lastMessageAt": "2024-01-01T14:30:00.000Z",
    "messagesCount": 15,
    "meta": {...},
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T14:30:00.000Z"
  }
}
```

### PUT /api/chat-sessions/:sessionId/title
Update session title.

**Request Body:**
```json
{
  "title": "Updated Chat Title"
}
```

### PUT /api/chat-sessions/:sessionId/meta
Update session metadata.

**Request Body:**
```json
{
  "meta": {
    "plantType": "outdoor",
    "difficulty": "advanced",
    "notes": "Added more details"
  }
}
```

### DELETE /api/chat-sessions/:sessionId
Delete session and all associated messages.

**Response:**
```json
{
  "success": true,
  "message": "Session deleted successfully",
  "data": {
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "deletedMessages": 15
  }
}
```

## Database Schema

### chat_sessions Collection
```javascript
{
  sessionId: String,        // UUID v4 (unique, indexed)
  user: ObjectId,           // Reference to users collection
  title: String,            // Session title (nullable, max 200 chars)
  lastMessageAt: Date,      // Last message timestamp
  messagesCount: Number,    // Total message count
  meta: Object,             // Additional metadata
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

## Indexes
- `{ sessionId: 1 }` - Unique index for session lookup
- `{ user: 1, lastMessageAt: -1 }` - Compound index for user sessions
- `{ title: 'text' }` - Text index for title search

## Integration
This module integrates with:
- Chat messages module for statistics updates
- Auth module for user authentication
- Rate limiting middleware
- Error handling middleware

## Performance Features
- Separate session metadata from messages for faster queries
- Efficient pagination with compound indexes
- Text search on session titles
- Automatic statistics updates when messages are added
