# 📥 HƯỚNG DẪN IMPORT DỮ LIỆU TỪ GOOGLE SHEETS

**Last Updated:** 2024-11-18  
**Status:** Ready to Import

---

## 🎯 TỔNG QUAN

Hướng dẫn này sẽ giúp bạn import data từ 3 Google Sheets vào MongoDB database:

1. **THUOC** → `products` collection
2. **SINHHOC** → `biological_methods` collection  
3. **CANHTAC** → `cultural_practices` collection

---

## 📋 BƯỚC 1: EXPORT GOOGLE SHEETS TO CSV

### **1.1. Sheet THUOC (Products)**

1. Mở Google Sheet **THUOC**
2. Đảm bảo có các cột sau (theo thứ tự):
   - `STT` (có thể bỏ qua)
   - `Tên sản phẩm`
   - `Hoạt chất`
   - `Nhà SX`
   - `Dùng cho bệnh` (cách nhau bởi dấu phẩy)
   - `Dùng cho cây` (cách nhau bởi dấu phẩy)
   - `Liều lượng`
   - `Cách dùng`
   - `Giá`
   - `Image URL` (optional)
   - `Nguồn`

3. **File → Download → Comma Separated Values (.csv)**
4. Lưu file thành: `products.csv`

**Ví dụ format:**
```csv
STT,Tên sản phẩm,Hoạt chất,Nhà SX,Dùng cho bệnh,Dùng cho cây,Liều lượng,Cách dùng,Giá,Image URL,Nguồn
1,Apron® XL 350 ES,Metalaxyl-M (350 g/L),Syngenta Vietnam Ltd,Mốc sương,Ngô,50–100 ml/100 kg hạt giống,Pha 50–100 ml thuốc với 500 ml nước,N/A,,Syngenta Vietnam + NongNghiepTayNguyen.vn
```

---

### **1.2. Sheet SINHHOC (Biological Methods)**

1. Mở Google Sheet **SINHHOC**
2. Đảm bảo có các cột sau:
   - `STT` (có thể bỏ qua)
   - `Tên phương pháp`
   - `Dùng cho bệnh` (cách nhau bởi dấu phẩy)
   - `Vật liệu cần thiết`
   - `Cách thực hiện`
   - `Thời gian`
   - `Hiệu quả (%)`
   - `Nguồn`
   - `Verified` (✓ hoặc để trống)

3. **File → Download → Comma Separated Values (.csv)**
4. Lưu file thành: `biological_methods.csv`

**Ví dụ format:**
```csv
STT,Tên phương pháp,Dùng cho bệnh,Vật liệu cần thiết,Cách thực hiện,Thời gian,Hiệu quả (%),Nguồn,Verified
1,Sử dụng Trichoderma,Nấm đất,Chế phẩm Trichoderma sp.,Pha 10g với 10L nước,2–3 tuần,60–70%,FAO IPM Guidelines (2023),✓
```

---

### **1.3. Sheet CANHTAC (Cultural Practices)**

1. Mở Google Sheet **CANHTAC**
2. Đảm bảo có các cột sau:
   - `STT` (có thể bỏ qua)
   - `Danh mục` (Đất, Nước, Phân bón, Ánh sáng, Khoảng cách)
   - `Hành động`
   - `Mô tả chi tiết`
   - `Ưu tiên` (High, Medium, Low)
   - `Áp dụng cho` (cách nhau bởi dấu phẩy)
   - `Nguồn`

3. **File → Download → Comma Separated Values (.csv)**
4. Lưu file thành: `cultural_practices.csv`

**Ví dụ format:**
```csv
STT,Danh mục,Hành động,Mô tả chi tiết,Ưu tiên,Áp dụng cho,Nguồn
1,Đất,Nâng luống & rãnh thoát nước,Tạo luống cao 20–30 cm,High,Cà chua,FAO Best Practices (2022)
```

---

## 📂 BƯỚC 2: COPY CSV FILES VÀO BACKEND

1. Copy 3 file CSV vừa export vào thư mục:
   ```
   CAPTONE1/apps/backend/data/
   ```

2. Đảm bảo có đúng 3 files:
   ```
   apps/backend/data/
   ├── products.csv
   ├── biological_methods.csv
   └── cultural_practices.csv
   ```

---

## 🚀 BƯỚC 3: RUN IMPORT SCRIPT

### **3.1. Mở Terminal và di chuyển vào backend:**

```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
```

### **3.2. Chạy import script:**

```bash
node scripts/importTreatments.js
```

### **3.3. Kiểm tra output:**

Output thành công sẽ trông như này:

```
🚀 Starting treatment data import...

📡 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Checking for CSV files...
✅ Found: products.csv
✅ Found: biological_methods.csv
✅ Found: cultural_practices.csv

📦 Importing products from: /path/to/products.csv
Found 30 products in CSV
🗑️  Cleared existing products
✅ Imported 30 products

🌿 Importing biological methods from: /path/to/biological_methods.csv
Found 10 biological methods in CSV
🗑️  Cleared existing biological methods
✅ Imported 10 biological methods

🌾 Importing cultural practices from: /path/to/cultural_practices.csv
Found 20 cultural practices in CSV
🗑️  Cleared existing cultural practices
✅ Imported 20 cultural practices

==================================================
🎉 Import completed! Total: 60 documents imported
==================================================

✅ MongoDB connection closed
```

---

## ✅ BƯỚC 4: VERIFY DATA

### **4.1. Check stats qua API:**

```bash
curl http://localhost:4000/api/v1/treatments/stats
```

**Expected output:**
```json
{
  "success": true,
  "data": {
    "products": 30,
    "biologicalMethods": 10,
    "culturalPractices": 20,
    "total": 60
  }
}
```

### **4.2. Check MongoDB Compass:**

1. Mở MongoDB Compass
2. Connect tới database của bạn
3. Kiểm tra 3 collections:
   - `products` - Có 30 documents
   - `biologicalmethods` - Có 10 documents
   - `culturalpractices` - Có 20 documents

---

## 🧪 BƯỚC 5: TEST WITH FRONTEND

### **5.1. Start Backend:**
```bash
cd apps/backend
npm run dev
```

### **5.2. Start Frontend:**
```bash
cd apps/frontend
npm run dev
```

### **5.3. Test Flow:**

1. Đăng nhập vào app
2. Vào trang **Chat Analyze**
3. Upload hình ảnh cây có bệnh (ví dụ: cà chua bị bệnh phấn trắng)
4. Kiểm tra xem có hiện:
   - ✅ **Treatment Recommendations** (Chemical, Biological, Cultural)
   - ✅ **Additional Information** với sản phẩm từ database
   - ✅ Click vào sản phẩm → modal hiện chi tiết

---

## ⚠️ TROUBLESHOOTING

### **Issue 1: "CSV file not found"**

**Solution:**
- Đảm bảo file CSV nằm đúng thư mục `apps/backend/data/`
- Kiểm tra tên file: `products.csv`, `biological_methods.csv`, `cultural_practices.csv`

---

### **Issue 2: "Failed to parse CSV"**

**Solution:**
- Mở file CSV bằng text editor, đảm bảo encoding là UTF-8
- Kiểm tra không có dòng trống giữa dữ liệu
- Đảm bảo header (dòng đầu tiên) đúng format

---

### **Issue 3: "Duplicate key error"**

**Solution:**
- Script tự động xóa data cũ trước khi import
- Nếu vẫn lỗi, xóa thủ công:
  ```bash
  # Trong MongoDB shell:
  use your_database_name
  db.products.drop()
  db.biologicalmethods.drop()
  db.culturalpractices.drop()
  ```

---

### **Issue 4: "Connection failed"**

**Solution:**
- Kiểm tra `.env` có đúng `MONGODB_URI`
- Kiểm tra MongoDB đang chạy
- Kiểm tra network connection

---

## 📝 LƯU Ý QUAN TRỌNG

### **Về CSV Format:**

1. **Dấu phẩy trong data:**
   - Nếu data có dấu phẩy (ví dụ: "Cà chua, Ớt"), bọc trong dấu ngoặc kép: `"Cà chua, Ớt"`

2. **Multiple values:**
   - Các trường như `Dùng cho bệnh`, `Dùng cho cây`, `Áp dụng cho` có thể có nhiều giá trị
   - Cách nhau bởi dấu phẩy: `Cà chua, Ớt, Dưa`

3. **Empty fields:**
   - Để trống nếu không có data
   - Script sẽ tự động xử lý

### **Về Verified Field:**

- `✓` → `verified: true`
- Để trống → `verified: true` (default)

### **Về Image URLs:**

- Nếu không có hình, để trống → sẽ dùng placeholder: `/images/products/placeholder.png`
- Nếu có link Cloudinary hoặc public URL, paste vào

---

## 🔄 RE-IMPORT (CẬP NHẬT DATA)

Nếu bạn cần cập nhật data sau này:

1. Chỉnh sửa Google Sheets
2. Export lại thành CSV
3. Overwrite file cũ trong `apps/backend/data/`
4. Chạy lại: `node scripts/importTreatments.js`

Script sẽ **xóa hết data cũ** và import data mới.

---

## 🎯 CHECKLIST

Trước khi import, đảm bảo:

- [ ] 3 Google Sheets đã hoàn chỉnh data
- [ ] Export 3 CSV files
- [ ] Copy 3 files vào `apps/backend/data/`
- [ ] Backend đang chạy và connect được MongoDB
- [ ] Run import script
- [ ] Check stats API
- [ ] Test với frontend

---

## 🆘 HỖ TRỢ

Nếu gặp lỗi:

1. Check terminal output cho error message
2. Check `apps/backend/data/` có đúng 3 files
3. Check MongoDB connection string trong `.env`
4. Check format của CSV files (mở bằng text editor)

---

**🎉 DONE! DỮ LIỆU ĐÃ ĐƯỢC IMPORT VÀO DATABASE!**

---

**Last Updated:** 2024-11-18  
**Version:** 1.0  
**Script:** `scripts/importTreatments.js`

