# Posts Module

Module quản lý các bài viết trong cộng đồng GreenGrow.

## API Endpoints

### Public Routes

#### GET `/api/v1/posts`
Lấy danh sách tất cả bài viết đã published.

**Query Parameters:**
- `page` (number, default: 1): Trang hiện tại
- `limit` (number, default: 10, max: 100): Số lượng bài viết mỗi trang
- `tag` (string, optional): Lọc theo tag
- `search` (string, optional): Tìm kiếm theo text (title, content, tags)
- `category` (string, optional): Lọc theo category: `question`, `discussion`, `tip`, `problem`, `success`, `other`
- `sortBy` (string, default: `latest`): Sắp xếp theo:
  - `latest`: Mới nhất trước
  - `popular`: Nhiều likes nhất
  - `mostCommented`: Nhiều comments nhất

**Response:**
```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "posts": [...],
    "totalPages": 10,
    "currentPage": 1,
    "totalItems": 100
  }
}
```

#### GET `/api/v1/posts/:id`
Lấy chi tiết một bài viết theo ID.

**Response:**
```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "_id": "...",
    "title": "...",
    "content": "...",
    "author": {...},
    "comments": [...],
    "likes": [...],
    ...
  }
}
```

### Protected Routes (Requires Authentication)

#### POST `/api/v1/posts`
Tạo bài viết mới.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Tiêu đề bài viết",
  "content": "Nội dung bài viết",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "caption": "Caption"
    }
  ],
  "tags": ["tag1", "tag2"],
  "plants": ["plantId1"],
  "category": "question",
  "status": "published"
}
```

**Validation:**
- `title`: Required, 3-200 characters
- `content`: Required, 10-5000 characters
- `images`: Optional, max 10 images
- `tags`: Optional, max 10 tags, each tag max 50 characters
- `category`: Optional, enum: `question`, `discussion`, `tip`, `problem`, `success`, `other`
- `status`: Optional, enum: `draft`, `pending`, `published`, `rejected`, `archived`

#### PUT `/api/v1/posts/:id`
Cập nhật bài viết (chỉ author hoặc admin).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:** (tương tự như POST, nhưng tất cả fields đều optional)

#### DELETE `/api/v1/posts/:id`
Xóa bài viết (chỉ author hoặc admin).

**Headers:**
- `Authorization: Bearer <token>`

#### POST `/api/v1/posts/:id/comments`
Thêm comment vào bài viết.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Nội dung comment"
}
```

**Validation:**
- `content`: Required, 1-1000 characters

#### POST `/api/v1/posts/:id/like`
Like/Unlike bài viết.

**Headers:**
- `Authorization: Bearer <token>`

**Response:** Trả về bài viết đã được cập nhật với likes array mới.

## Model Schema

```javascript
{
  title: String (required, 3-200 chars),
  content: String (required, 10-5000 chars),
  images: [{
    url: String,
    caption: String
  }],
  author: ObjectId (ref: User),
  tags: [String],
  likes: [ObjectId] (ref: User),
  comments: [{
    content: String,
    author: ObjectId (ref: User),
    createdAt: Date,
    updatedAt: Date
  }],
  plants: [ObjectId] (ref: Plant),
  category: String (enum: question, discussion, tip, problem, success, other),
  status: String (enum: draft, pending, published, rejected, archived),
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

- Text index: `title`, `content`, `tags`
- Index: `author`, `createdAt`
- Index: `category`, `createdAt`
- Index: `status`, `createdAt`
- Index: `createdAt`

## Notes

- Chỉ bài viết có `status: 'published'` mới được hiển thị trong danh sách công khai
- Users chỉ có thể like/comment trên bài viết đã published
- Chỉ author hoặc admin mới có thể update/delete bài viết
- Sort `popular` và `mostCommented` sử dụng MongoDB aggregation để tính toán số lượng likes/comments

