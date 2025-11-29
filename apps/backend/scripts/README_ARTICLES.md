# Hướng dẫn thêm Bài báo liên quan cho Tỉnh/Thành phố

## Cách 1: Sử dụng Script (Khuyến nghị)

1. Mở file `addProvinceArticles.js`
2. Thêm dữ liệu articles vào object `articlesData`:

```javascript
const articlesData = {
  "DN": [  // Mã tỉnh (ví dụ: DN = Đà Nẵng)
    {
      title: "Tiêu đề bài báo",
      url: "https://example.com/article",
      source: "Nguồn báo",
      date: new Date("2024-01-15") // Optional
    }
  ],
  "HN": [
    // Thêm articles cho Hà Nội...
  ]
};
```

3. Chạy script:
```bash
cd apps/backend
node scripts/addProvinceArticles.js
```

## Cách 2: Thêm trực tiếp vào MongoDB

Sử dụng MongoDB Compass hoặc mongo shell:

```javascript
db.province_agriculture.updateOne(
  { provinceCode: "DN" },  // Mã tỉnh
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

## Cách 3: Import từ Google Sheets

1. Tạo Google Sheet với format:
   - Column A: Province Code (e.g., "DN")
   - Column B: Title
   - Column C: URL
   - Column D: Source
   - Column E: Date (optional)

2. Export thành CSV/JSON
3. Tạo script import tương tự `importProvinceData.js`

## Lưu ý

- URL phải là link thực tế, có thể truy cập được
- Title nên ngắn gọn, dễ hiểu
- Source nên là tên báo/tạp chí uy tín
- Date là optional nhưng nên có để sắp xếp theo thời gian

## Danh sách mã tỉnh

- HN: Hà Nội
- HCM: Hồ Chí Minh
- DN: Đà Nẵng
- HP: Hải Phòng
- CT: Cần Thơ
- ... (xem file `vietnamProvinces.js` để biết đầy đủ)

