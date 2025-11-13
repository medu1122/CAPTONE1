# ✅ Community Feature - Setup Complete

## 📋 Đã hoàn thành

### 1. Database Collections
- ✅ Collection `posts` đã được tạo trong MongoDB
- ✅ Indexes đã được thiết lập (text search, filtering, sorting)
- ✅ Sample data đã được seed (nếu chạy script mongosh)

### 2. Backend API
- ✅ **Post Model** (`post.model.js`):
  - Thêm `category` field (enum: question, discussion, tip, problem, success, other)
  - Thêm `status` field (enum: draft, pending, published, rejected, archived)
  - Indexes cho text search, filtering, sorting

- ✅ **Post Controller** (`post.controller.js`):
  - `getAllPosts`: Filter theo category, tag, search, sort (latest/popular/mostCommented)
  - `getPostById`: Chỉ hiển thị published posts
  - `createPost`: Tạo post mới với default values
  - `updatePost`: Update post (chỉ author/admin)
  - `deletePost`: Delete post (chỉ author/admin)
  - `addComment`: Thêm comment vào post
  - `toggleLike`: Like/Unlike post

- ✅ **Post Validation** (`post.validation.js`):
  - Validate create post
  - Validate update post
  - Validate add comment
  - Validate query parameters

- ✅ **Post Routes** (`post.routes.js`):
  - Đã đăng ký trong main router (`/api/v1/posts`)
  - Validation middleware đã được thêm

### 3. Frontend Integration
- ✅ **Community Service** (`communityService.ts`):
  - Transform backend data → frontend format
  - Normalize likes array (convert objects to IDs)
  - Handle all API endpoints

- ✅ **API Config**: Đã có endpoints cho posts

## 🧪 Testing Checklist

### 1. Test Backend Server
```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
npm run dev
```

Kiểm tra:
- ✅ Server khởi động không có lỗi
- ✅ Route `/api/v1/posts` được đăng ký
- ✅ MongoDB connection thành công

### 2. Test API Endpoints

#### Public Endpoints (không cần auth):
```bash
# Get all posts
GET http://localhost:4000/api/v1/posts

# Get posts with filters
GET http://localhost:4000/api/v1/posts?category=question&page=1&limit=10&sortBy=latest

# Get post by ID
GET http://localhost:4000/api/v1/posts/:id
```

#### Protected Endpoints (cần auth token):
```bash
# Create post
POST http://localhost:4000/api/v1/posts
Headers: Authorization: Bearer <token>
Body: {
  "title": "Test Post",
  "content": "Test content",
  "category": "question",
  "tags": ["test"]
}

# Like post
POST http://localhost:4000/api/v1/posts/:id/like
Headers: Authorization: Bearer <token>

# Add comment
POST http://localhost:4000/api/v1/posts/:id/comments
Headers: Authorization: Bearer <token>
Body: {
  "content": "Test comment"
}
```

### 3. Test Frontend
```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/frontend
npm run dev
```

Truy cập: `http://localhost:5173/community`

Kiểm tra:
- ✅ Trang Community hiển thị danh sách posts
- ✅ Filter theo category hoạt động
- ✅ Search hoạt động
- ✅ Sort (latest/popular/mostCommented) hoạt động
- ✅ Tạo post mới
- ✅ Like/Unlike post
- ✅ Thêm comment
- ✅ Pagination hoạt động

## 📝 Lưu ý

### Database
- Đảm bảo MongoDB đang chạy
- Collection `posts` đã được tạo
- Có ít nhất 1 user trong collection `users` để làm author

### Backend
- Server chạy tại `http://localhost:4000`
- API base URL: `/api/v1/posts`
- Chỉ posts có `status: 'published'` mới hiển thị công khai

### Frontend
- Frontend chạy tại `http://localhost:5173`
- Cần đăng nhập để tạo post, like, comment
- Route `/community` được bảo vệ (cần auth)

## 🐛 Troubleshooting

### Backend không khởi động
- Kiểm tra MongoDB connection
- Kiểm tra `.env` file có đúng config không
- Kiểm tra dependencies: `npm install`

### API trả về 404
- Kiểm tra route đã được đăng ký trong `routes.js`
- Kiểm tra MongoDB collection `posts` đã tồn tại

### Frontend không load posts
- Kiểm tra backend đang chạy
- Kiểm tra API base URL trong `config/api.ts`
- Kiểm tra CORS settings
- Kiểm tra browser console có lỗi không

### Likes không hoạt động
- Kiểm tra user đã đăng nhập
- Kiểm tra `user.id` format (phải là string)
- Kiểm tra backend populate likes (không nên populate, chỉ trả về array of IDs)

## 🎯 Next Steps (Optional)

1. **Thêm endpoints cho comments**:
   - DELETE `/api/v1/posts/:postId/comments/:commentId`
   - PUT `/api/v1/posts/:postId/comments/:commentId`

2. **Thêm post views tracking**:
   - POST `/api/v1/posts/:id/view` (track view count)

3. **Thêm post reports**:
   - POST `/api/v1/posts/:id/report` (report inappropriate content)

4. **Admin features**:
   - GET `/api/v1/posts/admin/pending` (pending posts)
   - PUT `/api/v1/posts/:id/approve` (approve post)
   - PUT `/api/v1/posts/:id/reject` (reject post)

---

**Status**: ✅ Ready for Testing
**Last Updated**: $(date)

