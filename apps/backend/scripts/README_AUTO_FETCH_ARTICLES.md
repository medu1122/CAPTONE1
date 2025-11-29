# Hướng dẫn Tự động Fetch Bài báo

## Tổng quan

Script `fetchProvinceArticles.js` tự động thu thập bài báo liên quan đến nông nghiệp, thời tiết, mùa vụ từ các nguồn RSS công khai.

## Nguồn dữ liệu

1. **Google News RSS**: Tìm kiếm bài báo theo từ khóa (nông nghiệp, thời tiết, mùa vụ, cây trồng) + tên tỉnh
2. **VnExpress RSS**: Lọc bài báo liên quan đến tỉnh từ RSS kinh tế

## Cách sử dụng

### Chạy thủ công

```bash
cd apps/backend
npm run fetch-articles
```

Hoặc:

```bash
node scripts/fetchProvinceArticles.js
```

### Tự động hóa với Cron Job

#### Linux/Mac:

```bash
# Mở crontab
crontab -e

# Thêm dòng này để chạy mỗi ngày lúc 2h sáng
0 2 * * * cd /path/to/CAPTONE1/apps/backend && npm run fetch-articles >> /tmp/fetch-articles.log 2>&1
```

#### Windows (Task Scheduler):

1. Mở Task Scheduler
2. Tạo task mới
3. Trigger: Daily, 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/fetchProvinceArticles.js`
   - Start in: `C:\path\to\CAPTONE1\apps\backend`

## Tính năng

- ✅ Tự động fetch từ nhiều nguồn
- ✅ Loại bỏ trùng lặp (theo URL)
- ✅ Chỉ thêm bài mới (không duplicate)
- ✅ Giữ tối đa 20 bài mới nhất mỗi tỉnh
- ✅ Sắp xếp theo ngày (mới nhất trước)
- ✅ Rate limiting (delay 1s giữa các tỉnh)

## Lưu ý

1. **Rate Limiting**: 
   - Script có delay 1 giây giữa mỗi tỉnh để tránh bị block
   - Nếu fetch 63 tỉnh, sẽ mất khoảng 1-2 phút

2. **Google News URLs**:
   - Một số URL có thể là redirect link từ Google News
   - URL thực tế có thể cần click để resolve

3. **VnExpress RSS**:
   - Hiện tại dùng RSS kinh tế, có thể thay đổi sang RSS khác
   - Chỉ lấy bài có chứa tên tỉnh trong title/description

4. **Dữ liệu**:
   - Script chỉ fetch, không verify nội dung
   - Nên review thủ công một số bài để đảm bảo chất lượng

## Tùy chỉnh

### Thêm nguồn RSS khác

Mở `fetchProvinceArticles.js` và thêm function mới:

```javascript
const fetchFromNewSource = async (provinceName) => {
  // Implementation
};

// Thêm vào Promise.all trong fetchAllProvinceArticles
const [googleArticles, vnexpressArticles, newSourceArticles] = await Promise.all([
  fetchFromGoogleNews(provinceName),
  fetchFromVnExpress(provinceName),
  fetchFromNewSource(provinceName)
]);
```

### Thay đổi keywords

Sửa trong `fetchFromGoogleNews`:

```javascript
const keywords = ['nông nghiệp', 'thời tiết', 'mùa vụ', 'cây trồng', 'canh tác'];
```

### Thay đổi số lượng bài

Sửa trong `fetchFromGoogleNews`:

```javascript
const articles = items.slice(0, 10); // Thay vì 5
```

Và trong `fetchAllProvinceArticles`:

```javascript
province.articles = province.articles.slice(0, 30); // Thay vì 20
```

## Troubleshooting

### Lỗi: "Cannot find module 'xml2js'"

```bash
npm install xml2js
```

### Lỗi: "Connection timeout"

- Kiểm tra internet connection
- Có thể Google News đang rate limit, đợi vài phút rồi thử lại

### Không fetch được bài nào

- Kiểm tra từ khóa có phù hợp không
- Thử search thủ công trên Google News với query tương tự
- Có thể cần thay đổi User-Agent

### MongoDB connection error

- Kiểm tra MongoDB đang chạy
- Kiểm tra MONGODB_URI trong .env

## Kết quả

Sau khi chạy, bạn sẽ thấy:

```
🚀 Starting automatic article fetching...

📡 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 63 provinces

📍 Processing: Hà Nội (HN)
  🔍 Searching: Hà Nội (nông nghiệp OR thời tiết OR mùa vụ OR cây trồng)
  ✅ Fetched 8 articles
  ✅ Added 5 new articles

📍 Processing: Hồ Chí Minh (HCM)
  ...

==================================================
🎉 Fetch completed!
   📰 Total fetched: 250 articles
   ✅ Total added: 180 new articles
==================================================
```

## Best Practices

1. **Chạy định kỳ**: Mỗi ngày 1 lần vào giờ thấp điểm (2-3h sáng)
2. **Monitor logs**: Kiểm tra log để đảm bảo script chạy đúng
3. **Review articles**: Định kỳ review một số bài để đảm bảo chất lượng
4. **Backup**: Trước khi chạy lần đầu, backup database

