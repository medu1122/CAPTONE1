# 🔧 Admin Setup Scripts

Tài liệu hướng dẫn setup các collections và indexes cho Admin Dashboard.

## 📋 Tổng quan

Các scripts này sẽ:
1. Tạo collections mới: `complaints`, `reports`
2. Thêm fields mới vào collections hiện có: `users`, `posts`
3. Tạo indexes cần thiết cho các queries admin

## 🚀 Cách sử dụng

### 1. Setup Collections và Indexes

Chạy script để tạo collections và indexes:

```bash
cd apps/backend
node scripts/setupAdminCollections.js
```

Script này sẽ:
- ✅ Tạo `complaints` collection với 5 indexes
- ✅ Tạo `reports` collection với 5 indexes
- ✅ Thêm indexes mới cho `users` (6 indexes)
- ✅ Thêm indexes mới cho `posts` (3 indexes)
- ✅ Thêm indexes mới cho `analyses` (3 indexes)
- ✅ Thêm indexes mới cho `auth_tokens` (1 index)

### 2. Migrate Existing Documents

Chạy script để thêm fields mới vào documents hiện có:

```bash
node scripts/migrateAdminFields.js
```

Script này sẽ:
- ✅ Thêm `mutedUntil` và `muteReason` vào tất cả users
- ✅ Thêm `reportCount` và `lastReportedAt` vào tất cả posts
- ✅ Hiển thị thống kê collections và indexes

### 3. Verify Setup

Chạy script để kiểm tra setup:

```bash
node scripts/verifyAdminSetup.js
```

Script này sẽ:
- ✅ Kiểm tra tất cả collections có tồn tại
- ✅ Kiểm tra tất cả fields có đúng
- ✅ Kiểm tra tất cả indexes có được tạo
- ✅ Hiển thị báo cáo chi tiết

## 📊 Collections được tạo

### 1. complaints
- **Mục đích**: Lưu trữ khiếu nại từ users
- **Fields chính**: user, type, category, title, description, status, adminNotes
- **Indexes**: 5 indexes cho queries hiệu quả

### 2. reports
- **Mục đích**: Lưu trữ báo cáo về posts/comments
- **Fields chính**: user, type, targetId, targetType, reason, status, adminNotes
- **Indexes**: 5 indexes cho queries hiệu quả

## 🔄 Fields được thêm vào Collections hiện có

### Users Collection
- `mutedUntil` (Date/null): Thời gian hết hạn mute
- `muteReason` (String/null): Lý do mute

### Posts Collection
- `reportCount` (Number): Số lượng báo cáo
- `lastReportedAt` (Date/null): Thời gian báo cáo gần nhất

## 📈 Indexes được tạo

### Users Indexes
- `{ role: 1 }` - Filter theo role
- `{ status: 1 }` - Filter theo status
- `{ isVerified: 1 }` - Filter verified/unverified
- `{ role: 1, status: 1 }` - Compound index
- `{ createdAt: 1 }` - User growth statistics
- `{ mutedUntil: 1 }` - Tìm muted users

### Posts Indexes
- `{ createdAt: 1 }` - Daily posts count
- `{ reportCount: -1, createdAt: -1 }` - Most reported posts
- `{ lastReportedAt: -1 }` - Recently reported posts

### Analyses Indexes
- `{ createdAt: 1 }` - Daily analysis count
- `{ source: 1, createdAt: -1 }` - Filter theo source
- `{ "resultTop.plant.commonName": 1 }` - Top plants statistics

### Auth Tokens Indexes
- `{ expiresAt: 1, createdAt: -1 }` - Online users query

## ⚠️ Lưu ý

1. **Backup Database**: Nên backup database trước khi chạy migration
2. **MongoDB đang chạy**: Đảm bảo MongoDB đang chạy trước khi chạy scripts
3. **Environment Variables**: Đảm bảo `.env` có `MONGO_URI` đúng
4. **Chạy theo thứ tự**: Chạy `setupAdminCollections.js` trước, sau đó `migrateAdminFields.js`

## 🔍 Troubleshooting

### Lỗi "Collection already exists"
- Không sao, script sẽ bỏ qua và tiếp tục tạo indexes

### Lỗi "Index already exists"
- Không sao, MongoDB sẽ bỏ qua indexes đã tồn tại

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB có đang chạy không
- Kiểm tra `MONGO_URI` trong `.env`
- Kiểm tra firewall/network settings

## 📝 Checklist

Sau khi chạy scripts, kiểm tra:

- [ ] `complaints` collection tồn tại
- [ ] `reports` collection tồn tại
- [ ] Users có fields `mutedUntil` và `muteReason`
- [ ] Posts có fields `reportCount` và `lastReportedAt`
- [ ] Tất cả indexes đã được tạo
- [ ] Script `verifyAdminSetup.js` chạy thành công

## 🎯 Kết quả mong đợi

Sau khi setup xong, bạn sẽ có:
- ✅ 2 collections mới (complaints, reports)
- ✅ 2 collections được cập nhật (users, posts)
- ✅ Tổng cộng 20+ indexes mới
- ✅ Sẵn sàng cho Admin Dashboard APIs

