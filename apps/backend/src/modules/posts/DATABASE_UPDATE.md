# Database Update for Reply Comments Feature

## 📋 Thay đổi Database Schema

### 1. Comment Schema đã được cập nhật
- ✅ Thêm field `parentComment` vào `commentSchema`
- ✅ Field này là ObjectId reference đến comment cha (hoặc null nếu là root comment)

### 2. Backward Compatibility
- ✅ **Không cần migration**: Field `parentComment` có `default: null`
- ✅ Các comments cũ (không có parentComment) sẽ tự động có giá trị `null`
- ✅ Các comments cũ sẽ được xử lý như root comments (không có reply)

## 🔧 Database Scripts

### Kiểm tra Schema
```javascript
// Trong mongosh
use GreenGrow
db.posts.findOne({}, { comments: 1 })
```

### Kiểm tra Comments có parentComment
```javascript
// Tìm comments có reply
db.posts.aggregate([
  { $unwind: "$comments" },
  { $match: { "comments.parentComment": { $ne: null } } },
  { $project: { postId: "$_id", comment: "$comments" } }
])
```

### Update Comments (nếu cần thêm parentComment cho test)
```javascript
// Tạo một reply comment (ví dụ)
// Chỉ cần tạo post mới với parentComment, không cần update posts cũ
```

## 📝 Lưu ý

### 1. Existing Data
- **Không cần migration**: Các posts/comments hiện tại vẫn hoạt động bình thường
- Comments cũ sẽ có `parentComment: null` (mặc định)
- Chúng sẽ được hiển thị như root comments

### 2. New Data
- Khi tạo comment mới, nếu có `parentId` trong request body, sẽ set `parentComment`
- Nếu không có `parentId`, `parentComment` sẽ là `null` (root comment)

### 3. Indexes
- **Không cần thêm index mới** cho `parentComment` vì:
  - Comments được lưu embedded trong Post document
  - Không có query trực tiếp trên parentComment field
  - Grouping được thực hiện trong application layer

## 🧪 Testing

### Test với MongoDB Compass hoặc mongosh:

1. **Tạo post với comment có reply:**
```javascript
use GreenGrow
const userId = db.users.findOne({}, { _id: 1 })?._id
const postId = db.posts.findOne({}, { _id: 1 })?._id

// Tạo root comment
const post = db.posts.findOne({ _id: postId })
const rootComment = {
  content: "Root comment",
  author: userId,
  parentComment: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Tạo reply comment
const replyComment = {
  content: "Reply to root comment",
  author: userId,
  parentComment: rootComment._id, // Reference to parent
  createdAt: new Date(),
  updatedAt: new Date()
}

db.posts.updateOne(
  { _id: postId },
  { $push: { comments: { $each: [rootComment, replyComment] } } }
)
```

2. **Kiểm tra structure:**
```javascript
db.posts.findOne({ _id: postId }, { comments: 1 })
```

## ✅ Summary

- **Backend**: ✅ Đã cập nhật schema và logic
- **Database**: ✅ Không cần migration (backward compatible)
- **Existing Data**: ✅ Vẫn hoạt động bình thường
- **New Features**: ✅ Reply comments hoạt động đúng

---

**Status**: ✅ Ready - No migration needed
**Last Updated**: $(date)

