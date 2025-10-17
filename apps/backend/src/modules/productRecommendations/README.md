# Product Recommendations Module

Module quản lý gợi ý sản phẩm nông nghiệp.

## Features

- Gợi ý sản phẩm dựa trên loại cây và bệnh
- Tìm kiếm sản phẩm theo từ khóa
- Quản lý danh mục sản phẩm
- Tích hợp link mua hàng (Shopee, Tiki, Lazada)

## Endpoints

### GET /api/v1/products/recommendations
Lấy gợi ý sản phẩm dựa trên cây trồng và bệnh.

**Query Parameters:**
- `plant` (string, required): Tên cây trồng
- `disease` (string, optional): Tên bệnh
- `category` (string, optional): Danh mục sản phẩm
- `limit` (number, optional): Số lượng kết quả (default: 10)

**Example:**
```bash
GET /api/v1/products/recommendations?plant=tomato&disease=leafspot&category=fertilizer
```

### GET /api/v1/products/search
Tìm kiếm sản phẩm theo từ khóa.

**Query Parameters:**
- `q` (string, required): Từ khóa tìm kiếm
- `category` (string, optional): Danh mục sản phẩm
- `page` (number, optional): Trang (default: 1)
- `limit` (number, optional): Số lượng/trang (default: 20)

**Example:**
```bash
GET /api/v1/products/search?q=phân bón&category=fertilizer&page=1&limit=10
```

### GET /api/v1/products/category/:category
Lấy sản phẩm theo danh mục.

**Path Parameters:**
- `category` (string, required): Danh mục sản phẩm

**Query Parameters:**
- `limit` (number, optional): Số lượng kết quả (default: 20)

### GET /api/v1/products/:productId
Lấy chi tiết sản phẩm.

**Path Parameters:**
- `productId` (string, required): ID sản phẩm

### POST /api/v1/products
Tạo sản phẩm mới (yêu cầu authentication).

**Body:**
```json
{
  "name": "Phân bón hữu cơ",
  "description": "Phân bón hữu cơ cho cây trồng",
  "category": "fertilizer",
  "price": 150000,
  "currency": "VND",
  "imageUrl": "https://example.com/image.jpg",
  "externalLinks": [
    {
      "platform": "shopee",
      "url": "https://shopee.vn/product",
      "price": 150000,
      "availability": "in_stock"
    }
  ],
  "tags": ["hữu cơ", "phân bón"],
  "plantTypes": ["cà chua", "dưa hấu"],
  "diseaseTypes": ["đốm lá"],
  "usageInstructions": "Bón 2-3 lần/tháng",
  "safetyNotes": "Để xa tầm tay trẻ em"
}
```

## Categories

- `fertilizer`: Phân bón
- `pesticide`: Thuốc trừ sâu
- `seed`: Hạt giống
- `tool`: Dụng cụ
- `soil`: Đất trồng
- `pot`: Chậu
- `irrigation`: Tưới tiêu
- `protection`: Bảo vệ
- `other`: Khác

## Response Format

```json
{
  "success": true,
  "data": {
    "plant": "tomato",
    "disease": "leafspot",
    "category": "fertilizer",
    "recommendations": [
      {
        "_id": "product_id",
        "name": "Phân bón NPK",
        "description": "Phân bón cân đối N-P-K",
        "category": "fertilizer",
        "price": 120000,
        "currency": "VND",
        "imageUrl": "https://example.com/image.jpg",
        "externalLinks": [
          {
            "platform": "shopee",
            "url": "https://shopee.vn/product",
            "price": 120000,
            "availability": "in_stock"
          }
        ],
        "tags": ["npk", "phân bón"],
        "plantTypes": ["cà chua", "dưa hấu"],
        "rating": {
          "average": 4.5,
          "count": 120
        }
      }
    ],
    "total": 1
  }
}
```
