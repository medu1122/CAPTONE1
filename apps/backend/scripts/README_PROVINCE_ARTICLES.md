# Hướng dẫn Import Bài báo từ Google Sheets

## Cách 1: Sử dụng Google Sheets (Khuyến nghị)

### Bước 1: Tạo Google Sheet

1. Tạo Google Sheet mới hoặc sử dụng sheet hiện có
2. Tạo một sheet tên là **"ARTICLES"**
3. Thêm các cột sau (dòng đầu tiên là header):

| Province Code | Title | URL | Source | Date |
|---------------|-------|-----|--------|------|
| DN | Nông nghiệp Đà Nẵng phát triển | https://example.com/article1 | Báo Nông nghiệp | 2024-01-15 |
| HN | Hà Nội đẩy mạnh nông nghiệp công nghệ cao | https://example.com/article2 | Báo Hà Nội Mới | 2024-01-20 |

**Lưu ý:**
- **Province Code**: Mã tỉnh (e.g., "DN", "HN", "HCM") - BẮT BUỘC
- **Title**: Tiêu đề bài báo - BẮT BUỘC
- **URL**: Link bài báo - BẮT BUỘC
- **Source**: Nguồn báo (optional)
- **Date**: Ngày đăng (optional, format: YYYY-MM-DD)
- **Image URL**: Link hình ảnh bài báo (optional)

### Bước 2: Setup Google Sheets API

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable **Google Sheets API**
4. Tạo **Service Account**:
   - Vào "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Đặt tên (e.g., "greengrow-sheets")
   - Click "Create and Continue"
   - Skip role assignment, click "Done"
5. Tạo key cho Service Account:
   - Click vào service account vừa tạo
   - Vào tab "Keys"
   - Click "Add Key" > "Create new key"
   - Chọn "JSON", download file
6. Share Google Sheet với Service Account:
   - Mở Google Sheet
   - Click "Share" (góc trên bên phải)
   - Thêm email của Service Account (tìm trong file JSON vừa download, field `client_email`)
   - Cho quyền "Viewer" là đủ

### Bước 3: Cấu hình .env

Thêm vào file `.env` của backend:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Lấy Sheet ID:**
- Mở Google Sheet
- URL sẽ có dạng: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
- Copy `SHEET_ID_HERE`

**Lấy Private Key:**
- Mở file JSON đã download
- Copy toàn bộ giá trị của field `private_key` (bao gồm cả `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`)
- Thay `\n` thực tế bằng `\n` trong string (hoặc để nguyên, script sẽ tự xử lý)

### Bước 4: Chạy script import

```bash
cd apps/backend
node scripts/importProvinceArticles.js
```

## Cách 2: Import từ Excel/CSV

1. Export Excel thành CSV
2. Chuyển đổi CSV thành JSON với format:
```json
[
  {
    "provinceCode": "DN",
    "title": "Nông nghiệp Đà Nẵng phát triển",
    "url": "https://example.com/article",
    "source": "Báo Nông nghiệp",
    "date": "2024-01-15"
  }
]
```
3. Tạo script import từ JSON (tương tự `addProvinceArticles.js`)

## Cách 3: Thêm trực tiếp vào MongoDB

Sử dụng MongoDB Compass hoặc mongo shell:

```javascript
db.province_agriculture.updateOne(
  { provinceCode: "DN" },
  {
    $push: {
      articles: {
        title: "Tiêu đề bài báo",
        url: "https://example.com/article",
        source: "Nguồn báo",
        date: new Date("2024-01-15")
      }
    }
  }
);
```

## Format Google Sheet

### Sheet: ARTICLES

| Province Code | Title | URL | Source | Date | Image URL |
|---------------|-------|-----|--------|------|-----------|
| DN | Nông nghiệp Đà Nẵng phát triển bền vững | https://example.com/danang-agriculture | Báo Nông nghiệp | 2024-01-15 | https://example.com/image.jpg |
| DN | Thời tiết Đà Nẵng thuận lợi cho sản xuất | https://example.com/danang-weather | Trung tâm Khí tượng | 2024-02-01 | |
| HN | Hà Nội đẩy mạnh nông nghiệp công nghệ cao | https://example.com/hanoi-tech | Báo Hà Nội Mới | 2024-01-20 | https://example.com/image2.jpg |

### Lưu ý

- **Province Code** phải khớp với mã tỉnh trong database (xem `vietnamProvinces.js`)
- **URL** phải là link thực tế, có thể truy cập được
- **Title** nên ngắn gọn, dễ hiểu
- **Source** nên là tên báo/tạp chí uy tín
- **Date** là optional nhưng nên có để sắp xếp theo thời gian

## Danh sách mã tỉnh

- HN: Hà Nội
- HCM: Hồ Chí Minh
- DN: Đà Nẵng
- HP: Hải Phòng
- CT: Cần Thơ
- ... (xem file `vietnamProvinces.js` để biết đầy đủ)

## Troubleshooting

### Lỗi: "Sheet ARTICLES not found"
- Kiểm tra tên sheet phải chính xác là "ARTICLES" (không phân biệt hoa thường)
- Đảm bảo đã share sheet với Service Account email

### Lỗi: "Missing Google Sheets credentials"
- Kiểm tra file `.env` có đầy đủ 3 biến: `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- Đảm bảo `GOOGLE_PRIVATE_KEY` có đầy đủ `\n` trong string

### Lỗi: "Province not found"
- Kiểm tra mã tỉnh trong sheet có đúng không
- Xem danh sách mã tỉnh trong `vietnamProvinces.js`

