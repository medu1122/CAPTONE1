# Password Reset Module

## Overview
This module handles password reset functionality for users who have forgotten their passwords.

## Features
- Generate secure reset tokens with 1-hour expiration
- Validate reset tokens
- Reset passwords using secure tokens
- Check for pending reset requests
- Automatic token cleanup via TTL
- Security-focused design (doesn't reveal if email exists)

## API Endpoints

### POST /api/password-reset/request
Request a password reset for an email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent",
  "data": {
    "resetToken": "abc123...",
    "expiresAt": "2024-01-01T13:00:00.000Z",
    "userEmail": "user@example.com"
  }
}
```

### POST /api/password-reset/validate-token
Validate a reset token before allowing password reset.

**Request Body:**
```json
{
  "resetToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset token is valid",
  "data": {
    "user": {
      "id": "64f8b123456789abcdef1234",
      "email": "user@example.com"
    }
  }
}
```

### POST /api/password-reset/reset
Reset password using a valid token.

**Request Body:**
```json
{
  "resetToken": "abc123...",
  "newPassword": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "64f8b123456789abcdef1234",
      "email": "user@example.com"
    }
  }
}
```

### GET /api/password-reset/pending-resets
Check for pending reset requests (protected route).

**Response:**
```json
{
  "success": true,
  "message": "Pending resets status retrieved",
  "data": {
    "hasPendingResets": true,
    "count": 2
  }
}
```

## Database Schema

### password_resets Collection
```javascript
{
  user: ObjectId,           // Reference to users collection
  tokenHash: String,        // SHA-256 hashed token
  expiresAt: Date,          // TTL index (1 hour)
  createdAt: Date,          // Creation timestamp
  used: Boolean             // Whether token has been used
}
```

## Security Features
- Tokens are hashed before storage
- Short expiration time (1 hour)
- One-time use tokens
- Rate limiting on all endpoints
- Secure token generation (crypto.randomBytes)
- Doesn't reveal if email exists in system
- Validates user account status before reset

## Password Requirements
New passwords must meet the following criteria:
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number

## Integration
This module integrates with:
- Auth module for user validation and password hashing
- Rate limiting middleware
- Error handling middleware
- Bcrypt for password hashing
