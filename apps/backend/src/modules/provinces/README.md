# Province Agriculture Module

Module quản lý thông tin nông nghiệp theo tỉnh/thành phố Việt Nam.

## Features

- Thông tin loại đất theo tỉnh (từ GeoJSON)
- Lịch cây trồng theo mùa (tháng)
- Bài báo liên quan
- Nhiệt độ hiện tại (tích hợp Weather API)

## API Endpoints

### GET /api/v1/provinces
Lấy danh sách tất cả các tỉnh.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "provinceCode": "HN",
      "provinceName": "Hà Nội",
      "simpleMapsId": "VNHN"
    }
  ]
}
```

### GET /api/v1/provinces/:code/info
Lấy thông tin chi tiết của một tỉnh.

**Parameters:**
- `code`: Mã tỉnh (VD: "HN", "HCM")

**Response:**
```json
{
  "success": true,
  "data": {
    "provinceName": "Hà Nội",
    "provinceCode": "HN",
    "temperature": 25,
    "weatherDescription": "mây rải rác",
    "soilTypes": ["Đất xám bạc màu", "Đất phù sa"],
    "soilDetails": [
      {
        "type": "Đất xám bạc màu trên đá trầm tích",
        "domsoil": "Ao",
        "faosoil": "Ao90-2/3c"
      }
    ],
    "currentMonth": {
      "month": 1,
      "planting": ["Cà chua", "Ớt"],
      "harvesting": ["Rau cải", "Hành"]
    },
    "articles": [
      {
        "title": "Kỹ thuật trồng lúa Đông Xuân tại Hà Nội",
        "url": "https://...",
        "source": "Báo Nông nghiệp",
        "date": "2024-01-15"
      }
    ],
    "source": "Open Development Mekong - CC-BY-SA-4.0"
  }
}
```

## Database Schema

### Collection: `province_agriculture`

```javascript
{
  provinceCode: String (unique, indexed),
  simpleMapsId: String, // ID từ SVG map
  provinceName: String,
  soilTypes: [{
    type: String,
    domsoil: String,
    faosoil: String
  }],
  cropCalendar: [{
    month: Number (1-12),
    planting: [String],
    harvesting: [String]
  }],
  articles: [{
    title: String,
    url: String,
    source: String,
    date: Date
  }],
  source: String
}
```

## Import Data

### 1. Extract dữ liệu từ GeoJSON (Loại đất)

Chạy script extract:
```bash
cd apps/backend
node scripts/extractSoilData.js
```

Script sẽ:
- Đọc `data/soilmap.geojson`
- Map với tỉnh từ `vietnamProvinces.js`
- Tạo file `data/province_soil_data.json`

**Lưu ý:** Đảm bảo file `soilmap.geojson` đã được đặt trong `data/` folder.

### 2. Import vào MongoDB

Sau khi có file `province_soil_data.json`, chạy script import:
```bash
node scripts/importProvinceData.js
```

Script sẽ:
- Đọc `data/province_soil_data.json`
- Import/update vào MongoDB collection `province_agriculture`
- Map SVG ID từ `provinceMapping.ts`

**Output:**
```
✅ Imported: X provinces
🔄 Updated: Y provinces
⏭️  Skipped: Z provinces
```

### 3. Bổ sung dữ liệu cây trồng và bài báo

Có thể:
- Import từ Google Sheets (tương tự `importFromGoogleSheets.js`)
- Hoặc thêm trực tiếp vào MongoDB qua MongoDB Compass hoặc script

**Cấu trúc dữ liệu cần thêm:**
```javascript
{
  cropCalendar: [
    {
      month: 1,
      planting: ["Cà chua", "Ớt"],
      harvesting: ["Rau cải", "Hành"]
    },
    // ... 12 tháng
  ],
  articles: [
    {
      title: "Kỹ thuật trồng lúa Đông Xuân",
      url: "https://...",
      source: "Báo Nông nghiệp",
      date: new Date("2024-01-15")
    }
  ]
}
```

## Frontend Usage

Truy cập: `/map`

Component: `VietnamMapPage`
- Hiển thị bản đồ SVG tương tác
- Click vào tỉnh để xem thông tin
- Panel hiển thị: nhiệt độ, loại đất, cây trồng, bài báo

