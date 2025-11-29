# Hệ thống Tự động Fetch Articles

## Tổng quan

Hệ thống tự động thu thập bài báo liên quan đến nông nghiệp, thời tiết, mùa vụ cho các tỉnh thành. **Bạn KHÔNG cần chạy script thủ công** - hệ thống sẽ tự động fetch khi cần.

## Cách hoạt động

### 1. **Tự động khi User truy cập** (Mặc định - Đã tích hợp)

Khi user click vào một tỉnh trên bản đồ:
- Hệ thống kiểm tra articles của tỉnh đó
- Nếu articles rỗng, < 3 bài, hoặc tất cả đều cũ hơn 7 ngày
- → Tự động fetch articles mới (chạy ngầm, không block response)
- User vẫn nhận được response ngay, articles sẽ được cập nhật sau

**File:** `province.service.js` - function `autoFetchArticlesIfNeeded()`

### 2. **Background Job định kỳ** (Tùy chọn)

Chạy script để fetch articles cho tất cả tỉnh mỗi ngày:

```bash
cd apps/backend
npm run fetch-articles
```

Hoặc setup cron job để tự động chạy:

```bash
# Linux/Mac
crontab -e
# Thêm dòng:
0 2 * * * cd /path/to/CAPTONE1/apps/backend && npm run fetch-articles
```

**File:** `scripts/fetchProvinceArticles.js`

## Cấu trúc Files

```
src/modules/provinces/
├── articleFetcher.service.js    # Service fetch từ RSS (Google News, VnExpress)
├── articleBackgroundJob.js     # Background job fetch tất cả tỉnh
├── articleCron.js               # Cron scheduler (optional)
└── province.service.js          # Tích hợp auto-fetch

scripts/
└── fetchProvinceArticles.js     # Script chạy thủ công hoặc cron
```

## Nguồn dữ liệu

1. **Google News RSS**
   - Tìm kiếm: `[Tên tỉnh] (nông nghiệp OR thời tiết OR mùa vụ OR cây trồng)`
   - Lấy 5 bài mới nhất

2. **VnExpress RSS**
   - Lọc bài có chứa tên tỉnh trong title/description
   - Lấy 3 bài mới nhất

## Tính năng

- ✅ **Tự động fetch** khi user truy cập (nếu cần)
- ✅ **Loại bỏ trùng lặp** (theo URL)
- ✅ **Chỉ thêm bài mới** (không duplicate)
- ✅ **Giữ tối đa 20 bài** mới nhất mỗi tỉnh
- ✅ **Sắp xếp theo ngày** (mới nhất trước)
- ✅ **Rate limiting** (delay 1s giữa các tỉnh)
- ✅ **Non-blocking** (không làm chậm API response)

## Khi nào articles được fetch?

### Tự động (khi user truy cập):
- Articles rỗng (0 bài)
- Có ít hơn 3 bài
- Tất cả articles đều cũ hơn 7 ngày

### Background job:
- Chạy thủ công: `npm run fetch-articles`
- Hoặc setup cron để chạy tự động mỗi ngày

## Lưu ý

1. **Lần đầu tiên**: 
   - Khi user click tỉnh lần đầu, có thể mất 2-3 giây để fetch articles
   - Lần sau sẽ nhanh hơn vì đã có articles trong DB

2. **Rate Limiting**:
   - Google News có thể rate limit nếu fetch quá nhiều
   - Background job có delay 1s giữa mỗi tỉnh

3. **URL Redirect**:
   - Một số URL từ Google News là redirect link
   - User cần click để xem bài gốc

## Troubleshooting

### Articles không tự động fetch?

1. Kiểm tra console logs:
   ```
   🔄 Auto-fetching articles for [Tên tỉnh]...
   ✅ Auto-fetched X articles...
   ```

2. Kiểm tra internet connection

3. Kiểm tra Google News có accessible không

### Muốn fetch thủ công?

```bash
cd apps/backend
npm run fetch-articles
```

### Muốn tắt auto-fetch?

Comment out trong `province.service.js`:
```javascript
// autoFetchArticlesIfNeeded(province).catch(...);
```

## Best Practices

1. **Lần đầu setup**: Chạy background job 1 lần để populate dữ liệu:
   ```bash
   npm run fetch-articles
   ```

2. **Sau đó**: Để hệ thống tự động fetch khi user truy cập

3. **Maintenance**: Chạy background job mỗi tuần để cập nhật:
   ```bash
   # Setup cron job chạy mỗi Chủ nhật lúc 2h sáng
   0 2 * * 0 cd /path/to/backend && npm run fetch-articles
   ```

## Kết luận

**Bạn KHÔNG cần làm gì!** Hệ thống sẽ tự động:
- Fetch articles khi user truy cập tỉnh (nếu cần)
- Cập nhật articles định kỳ (nếu setup cron)

Chỉ cần chạy `npm run fetch-articles` 1 lần đầu để có dữ liệu ban đầu, sau đó để hệ thống tự động!

