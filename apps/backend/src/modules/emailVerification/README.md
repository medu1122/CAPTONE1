# Email Verification Module

## Overview
This module handles email verification for user accounts after registration.

## Features
- Generate verification tokens with 24-hour expiration
- Verify email using secure token validation
- Check verification status
- Resend verification emails
- Automatic token cleanup via TTL

## API Endpoints

### POST /api/email-verification/create-token
Create a verification token for a user.

**Request Body:**
```json
{
  "userId": "64f8b123456789abcdef1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification token created successfully",
  "data": {
    "verificationToken": "abc123...",
    "expiresAt": "2024-01-02T12:00:00.000Z",
    "userEmail": "user@example.com"
  }
}
```

### POST /api/email-verification/verify
Verify email using token.

**Request Body:**
```json
{
  "verificationToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "64f8b123456789abcdef1234",
      "email": "user@example.com",
      "isVerified": true
    }
  }
}
```

### GET /api/email-verification/status
Check verification status (protected route).

**Response:**
```json
{
  "success": true,
  "message": "Verification status retrieved",
  "data": {
    "isVerified": true,
    "email": "user@example.com"
  }
}
```

### POST /api/email-verification/resend
Resend verification email (protected route).

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "data": {
    "verificationToken": "def456...",
    "expiresAt": "2024-01-02T12:00:00.000Z"
  }
}
```

## Database Schema

### email_verifications Collection
```javascript
{
  user: ObjectId,           // Reference to users collection
  tokenHash: String,        // SHA-256 hashed token
  expiresAt: Date,          // TTL index (24 hours)
  createdAt: Date,          // Creation timestamp
  used: Boolean             // Whether token has been used
}
```

## Security Features
- Tokens are hashed before storage
- Automatic expiration via TTL indexes
- One-time use tokens
- Rate limiting on all endpoints
- Secure token generation (crypto.randomBytes)

## Integration
This module integrates with:
- Auth module for user verification status
- Rate limiting middleware
- Error handling middleware
