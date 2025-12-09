# 📋 Code Standards - GreenGrow

Tài liệu này mô tả các chuẩn code và best practices được sử dụng trong dự án GreenGrow.

## 📑 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Backend Standards](#backend-standards)
- [Frontend Standards](#frontend-standards)
- [Naming Conventions](#naming-conventions)
- [Code Organization](#code-organization)
- [Error Handling](#error-handling)
- [API Design](#api-design)
- [Database Standards](#database-standards)
- [Security Standards](#security-standards)
- [Testing Standards](#testing-standards)
- [Git Workflow](#git-workflow)

---

## 🎯 Tổng Quan

GreenGrow sử dụng kiến trúc monorepo với:
- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React + TypeScript + Vite

### Nguyên Tắc Chung

1. **Consistency**: Giữ tính nhất quán trong toàn bộ codebase
2. **Readability**: Code phải dễ đọc và dễ hiểu
3. **Maintainability**: Code phải dễ bảo trì và mở rộng
4. **Security**: Luôn ưu tiên bảo mật
5. **Performance**: Tối ưu hiệu suất khi có thể

---

## 🔧 Backend Standards

### Ngôn Ngữ & Runtime

- **Node.js**: Version 18+
- **ES Modules**: Sử dụng `import/export` thay vì `require/module.exports`
- **Strict Mode**: Luôn sử dụng strict mode

### Cấu Trúc Module

Mỗi module trong backend phải tuân theo cấu trúc sau:

```
modules/
  └── featureName/
      ├── featureName.controller.js    # Request handlers
      ├── featureName.service.js        # Business logic
      ├── featureName.model.js         # Mongoose models
      ├── featureName.routes.js         # Express routes
      ├── featureName.validator.js      # Joi validation (optional)
      └── README.md                     # Module documentation
```

### Controller Pattern

```javascript
/**
 * Description of what the function does
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const functionName = async (req, res, next) => {
  try {
    // Business logic through service
    const result = await serviceName.methodName(req.body);
    
    // Standardized response
    const { statusCode, body } = httpSuccess(200, 'Success message', result);
    res.status(statusCode).json(body);
  } catch (error) {
    next(error); // Pass to error middleware
  }
};
```

**Quy Tắc:**
- ✅ Luôn sử dụng `async/await`
- ✅ Luôn wrap trong `try/catch`
- ✅ Luôn pass errors đến `next(error)`
- ✅ Sử dụng `httpSuccess()` và `httpError()` từ `common/utils/http.js`
- ✅ Thêm JSDoc comments cho mọi function

### Service Pattern

```javascript
/**
 * Description of service method
 * @param {object} data - Input data
 * @returns {Promise<object>} Result object
 */
export const methodName = async (data) => {
  // Business logic here
  const result = await Model.findOne({ ... });
  
  if (!result) {
    throw httpError(404, 'Resource not found');
  }
  
  return result;
};
```

**Quy Tắc:**
- ✅ Service chứa business logic, không chứa HTTP logic
- ✅ Throw errors sử dụng `httpError()`
- ✅ Return data objects, không return HTTP responses

### Model Pattern

```javascript
import mongoose from 'mongoose';

const schemaName = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: [true, 'Error message'],
      trim: true,
      // ... other validations
    },
  },
  {
    timestamps: true, // Always include timestamps
  }
);

// Indexes
schemaName.index({ fieldName: 1 });

// Methods
schemaName.methods.methodName = function() {
  // Instance method
};

// Static methods
schemaName.statics.staticMethodName = function() {
  // Static method
};

export default mongoose.model('ModelName', schemaName);
```

**Quy Tắc:**
- ✅ Luôn sử dụng `timestamps: true`
- ✅ Thêm indexes cho các fields thường query
- ✅ Validation messages phải rõ ràng
- ✅ Sử dụng `select: false` cho sensitive fields (password, tokens)

### Route Pattern

```javascript
import express from 'express';
import * as controller from './featureName.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';

const router = express.Router();

// Public routes
router.post('/public-endpoint', controller.publicHandler);

// Protected routes
router.get('/protected', authenticate, controller.protectedHandler);

// Validated routes
router.post('/validated', authenticate, validate(schema), controller.validatedHandler);

export default router;
```

**Quy Tắc:**
- ✅ Group routes theo authentication requirement
- ✅ Sử dụng middleware phù hợp
- ✅ Export default router

### Error Handling

```javascript
// In service/controller
throw httpError(400, 'User-friendly error message');

// Error middleware handles automatically
// Returns: { message: 'User-friendly error message', stack: ... }
```

**Quy Tắc:**
- ✅ Luôn throw errors với status code phù hợp
- ✅ Error messages phải user-friendly
- ✅ Không expose sensitive information trong errors
- ✅ Stack traces chỉ hiển thị trong development

### HTTP Response Format

**Success Response:**
```javascript
{
  success: true,
  message: "Operation successful",
  data: { ... }
}
```

**Error Response:**
```javascript
{
  message: "Error message",
  stack: "..." // Only in development
}
```

---

## ⚛️ Frontend Standards

### Ngôn Ngữ & Framework

- **TypeScript**: Luôn sử dụng TypeScript
- **React**: Version 19+ với functional components
- **Hooks**: Sử dụng hooks thay vì class components

### Component Pattern

```typescript
import { useState, useEffect } from 'react'
import { SomeType } from '../types'

interface ComponentProps {
  propName: string
  optionalProp?: number
}

export const ComponentName = ({ propName, optionalProp }: ComponentProps) => {
  const [state, setState] = useState<string>('')
  
  useEffect(() => {
    // Side effects
  }, [dependencies])
  
  const handleAction = () => {
    // Handler logic
  }
  
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  )
}
```

**Quy Tắc:**
- ✅ Sử dụng functional components
- ✅ TypeScript interfaces cho props
- ✅ PascalCase cho component names
- ✅ camelCase cho variables và functions
- ✅ Sử dụng Tailwind CSS classes
- ✅ Export named exports, không export default

### File Organization

```
pages/
  └── PageName/
      ├── index.tsx              # Main page component
      ├── components/            # Page-specific components
      │   └── ComponentName.tsx
      └── types.ts               # TypeScript types

components/
  └── ComponentName/
      ├── ComponentName.tsx      # Component
      ├── ComponentName.test.tsx # Tests (if any)
      └── types.ts               # Component types
```

### Service Pattern

```typescript
import axios from 'axios'
import { API_CONFIG } from '../config/api'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Error handling logic
  }
)

export const serviceName = {
  methodName: async (params: ParamType): Promise<ResponseType> => {
    const response = await api.get('/endpoint', { params })
    return response.data
  },
}
```

**Quy Tắc:**
- ✅ Mỗi service file tương ứng với một backend module
- ✅ Sử dụng axios instance với interceptors
- ✅ TypeScript types cho parameters và return values
- ✅ Handle errors trong interceptors

### Hooks Pattern

```typescript
import { useState, useEffect } from 'react'

export const useCustomHook = (dependency: string) => {
  const [data, setData] = useState<DataType | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await service.method(dependency)
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [dependency])
  
  return { data, loading, error }
}
```

**Quy Tắc:**
- ✅ Custom hooks bắt đầu với `use`
- ✅ Return object với clear property names
- ✅ Handle loading và error states

### TypeScript Standards

```typescript
// Interfaces for objects
interface User {
  id: string
  name: string
  email: string
}

// Types for unions, primitives
type Status = 'active' | 'inactive' | 'pending'
type UserId = string

// Enums for constants
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Function types
type Handler = (event: Event) => void
```

**Quy Tắc:**
- ✅ Sử dụng `interface` cho objects
- ✅ Sử dụng `type` cho unions và aliases
- ✅ Sử dụng `enum` cho constants
- ✅ Avoid `any`, sử dụng `unknown` nếu cần
- ✅ Export types/interfaces từ `types.ts` files

---

## 📝 Naming Conventions

### Backend

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `auth.controller.js` |
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUserProfile()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Classes | PascalCase | `UserService` |
| Models | PascalCase | `User`, `Post` |

### Frontend

| Type | Convention | Example |
|------|-----------|---------|
| Files | PascalCase | `UserProfile.tsx` |
| Components | PascalCase | `UserProfile` |
| Variables | camelCase | `userName`, `isLoading` |
| Functions | camelCase | `handleSubmit()` |
| Hooks | camelCase (use prefix) | `useAuth()` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

### Database

| Type | Convention | Example |
|------|-----------|---------|
| Collections | camelCase | `users`, `plantBoxes` |
| Fields | camelCase | `userName`, `createdAt` |
| Indexes | Descriptive | `user_email_index` |

---

## 📁 Code Organization

### Backend Structure

```
src/
├── app.js                    # Express app setup
├── server.js                 # Server entry point
├── routes.js                 # Route registration
├── config/                   # Configuration files
│   └── db.js                # Database config
├── common/                   # Shared utilities
│   ├── constants.js         # App constants
│   ├── middleware/          # Shared middleware
│   ├── services/            # Shared services
│   └── utils/               # Utility functions
└── modules/                  # Feature modules
    └── featureName/
        ├── featureName.controller.js
        ├── featureName.service.js
        ├── featureName.model.js
        ├── featureName.routes.js
        └── README.md
```

### Frontend Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Root component
├── config/                   # Configuration
│   └── api.ts               # API config
├── components/               # Reusable components
│   ├── common/              # Common components
│   └── ui/                  # UI primitives
├── pages/                    # Page components
│   └── PageName/
│       ├── index.tsx
│       └── components/
├── services/                 # API services
├── contexts/                 # React contexts
├── hooks/                    # Custom hooks
├── utils/                    # Utility functions
└── types/                    # TypeScript types
```

---

## ⚠️ Error Handling

### Backend Error Handling

```javascript
// In controller
try {
  const result = await service.method()
  const { statusCode, body } = httpSuccess(200, 'Success', result)
  res.status(statusCode).json(body)
} catch (error) {
  next(error) // Pass to error middleware
}

// In service
if (!resource) {
  throw httpError(404, 'Resource not found')
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Frontend Error Handling

```typescript
try {
  const result = await service.method()
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  } else {
    // Handle other errors
    console.error('Error:', error.message)
  }
}
```

---

## 🌐 API Design

### RESTful Conventions

```
GET    /api/v1/resource          # List resources
GET    /api/v1/resource/:id      # Get single resource
POST   /api/v1/resource          # Create resource
PUT    /api/v1/resource/:id      # Update resource
DELETE /api/v1/resource/:id      # Delete resource
```

### Request/Response Format

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response Format:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Query Parameters

- Pagination: `?page=1&limit=10`
- Sorting: `?sort=createdAt&order=desc`
- Filtering: `?status=active&role=user`

---

## 🗄️ Database Standards

### Mongoose Schema

```javascript
const schema = new mongoose.Schema({
  // Required fields
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  
  // Optional fields
  description: {
    type: String,
    default: null,
    trim: true,
  },
  
  // Enums
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Nested objects
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
}, {
  timestamps: true, // Always include
})
```

### Indexes

```javascript
// Single field index
schema.index({ email: 1 })

// Compound index
schema.index({ userId: 1, status: 1 })

// Text search index
schema.index({ title: 'text', description: 'text' })
```

**Quy Tắc:**
- ✅ Index các fields thường query
- ✅ Index foreign keys
- ✅ Compound indexes cho queries phức tạp
- ✅ Text indexes cho search

---

## 🔒 Security Standards

### Authentication

- ✅ JWT tokens với expiration
- ✅ Refresh tokens stored securely
- ✅ Password hashing với bcrypt (salt rounds: 10)
- ✅ Token rotation on refresh

### Authorization

- ✅ Role-based access control (RBAC)
- ✅ Middleware checks: `authenticate`, `authorize`
- ✅ Resource ownership validation

### Input Validation

- ✅ Joi validation schemas
- ✅ Sanitize user inputs
- ✅ Validate file uploads
- ✅ Rate limiting on sensitive endpoints

### Security Headers

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ HTTPS in production
- ✅ Environment variables for secrets

---

## 🧪 Testing Standards

### Test Structure

```
tests/
├── unit/                      # Unit tests
├── integration/               # Integration tests
└── e2e/                       # End-to-end tests
```

### Test Naming

```javascript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something when condition', async () => {
      // Test implementation
    })
  })
})
```

---

## 🔀 Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/bug-name` - Bug fixes
- `hotfix/issue-name` - Urgent fixes
- `refactor/refactor-name` - Code refactoring

### Commit Messages

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add email verification
fix(posts): resolve comment count issue
docs(readme): update installation guide
```

### Code Review Checklist

- [ ] Code follows style guide
- [ ] No console.logs or debug code
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Tests added/updated

---

## 📚 Documentation Standards

### Code Comments

```javascript
/**
 * Description of what the function does
 * @param {string} paramName - Description of parameter
 * @returns {Promise<object>} Description of return value
 * @throws {Error} Description of when error is thrown
 */
export const functionName = async (paramName) => {
  // Implementation
}
```

### README Files

Mỗi module nên có README.md với:
- Mô tả module
- API endpoints
- Usage examples
- Dependencies

---

## ✅ Checklist Trước Khi Commit

### Backend

- [ ] Code follows controller → service → model pattern
- [ ] Error handling implemented
- [ ] JSDoc comments added
- [ ] Validation schemas defined
- [ ] Database indexes added if needed
- [ ] Environment variables documented

### Frontend

- [ ] TypeScript types defined
- [ ] Components are reusable
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design considered
- [ ] Accessibility considered

### General

- [ ] No console.logs or debug code
- [ ] No hardcoded values
- [ ] Environment variables used
- [ ] Security considerations addressed
- [ ] Performance optimized
- [ ] Code formatted consistently

---

## 📖 Tài Liệu Tham Khảo

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [REST API Design](https://restfulapi.net/)

---

**Lưu ý**: Tài liệu này sẽ được cập nhật thường xuyên. Vui lòng tham khảo version mới nhất trước khi bắt đầu coding.

