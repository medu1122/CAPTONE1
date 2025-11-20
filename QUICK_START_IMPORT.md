# ⚡ QUICK START: Import Data từ Google Sheets

**Chọn 1 trong 2 phương pháp!**

---

## 📋 CHECKLIST

Trước khi bắt đầu:

- [ ] 3 Google Sheets đã hoàn chỉnh (THUOC, SINHHOC, CANHTAC)
- [ ] Backend đang chạy (`npm run dev`)
- [ ] MongoDB đang chạy và connect được

---

## 🔥 CHỌN PHƯƠNG PHÁP

### **OPTION 1: CSV Manual (Nhanh nhất - 5 phút)** ⭐ Khuyến nghị lần đầu

- ✅ Không cần setup gì
- ✅ Chỉ 3 bước đơn giản
- ❌ Phải export thủ công mỗi lần

### **OPTION 2: Google Sheets API (Tự động - setup 1 lần)** 🚀 Khuyến nghị nếu update thường xuyên

- ✅ Chỉ 1 lệnh, không cần export
- ✅ Tự động sync data
- ⚠️ Cần setup Google Cloud (10 phút lần đầu)

---

## 🚀 OPTION 1: CSV MANUAL (3 BƯỚC - 5 PHÚT)

### **1️⃣ Export CSV từ Google Sheets (2 phút)**

**Sheet THUOC:**
```
File → Download → CSV (.csv) → Lưu thành products.csv
```

**Sheet SINHHOC:**
```
File → Download → CSV (.csv) → Lưu thành biological_methods.csv
```

**Sheet CANHTAC:**
```
File → Download → CSV (.csv) → Lưu thành cultural_practices.csv
```

---

### **2️⃣ Copy vào Backend (1 phút)**

```bash
# Di chuyển CSV files vào thư mục data
cp ~/Downloads/products.csv /Users/macos/Documents/Captone1/CAPTONE1/apps/backend/data/
cp ~/Downloads/biological_methods.csv /Users/macos/Documents/Captone1/CAPTONE1/apps/backend/data/
cp ~/Downloads/cultural_practices.csv /Users/macos/Documents/Captone1/CAPTONE1/apps/backend/data/
```

---

### **3️⃣ Run Import Script (2 phút)**

```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
node scripts/importTreatments.js
```

**Đợi output:**
```
🎉 Import completed! Total: 60 documents imported
```

---

## ✅ VERIFY

**Check stats:**
```bash
curl http://localhost:4000/api/v1/treatments/stats
```

**Should return:**
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

---

## 🎯 TEST WITH FRONTEND

1. Start frontend: `cd apps/frontend && npm run dev`
2. Vào **Chat Analyze** page
3. Upload hình ảnh cây có bệnh
4. Check xem có hiện **Treatment Recommendations** không

---

## ⚠️ TROUBLESHOOTING

### **Lỗi "CSV file not found"**
→ Check đường dẫn file: `apps/backend/data/products.csv`

### **Lỗi "Connection failed"**
→ Check MongoDB đang chạy và `.env` có đúng `MONGODB_URI`

### **Lỗi "Failed to parse CSV"**
→ Mở CSV bằng text editor, check encoding UTF-8

---

## 📚 FULL DOCS

- **Chi tiết:** `apps/backend/HOW_TO_IMPORT_DATA.md`
- **CSV Format:** `apps/backend/data/README.md`
- **Backend Status:** `apps/backend/BACKEND_TREATMENT_COMPLETE.md`

---

**⏱️ TỔNG THỜI GIAN: 5 PHÚT!**

---

## 🚀 OPTION 2: GOOGLE SHEETS API (TỰ ĐỘNG)

### **Setup lần đầu (10 phút):**

Xem hướng dẫn chi tiết: **`GOOGLE_SHEETS_SETUP.md`**

**Tóm tắt:**
1. Cài package: `npm install google-spreadsheet google-auth-library`
2. Tạo Google Cloud Service Account
3. Download JSON credentials
4. Share Google Sheets với Service Account
5. Thêm vào `.env`:
   ```bash
   GOOGLE_SHEET_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN...-----"
   ```

### **Mỗi lần import (30 giây):**

```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
node scripts/importFromGoogleSheets.js
```

**Done! Không cần export, không cần copy files!** ✨

---

## 📊 SO SÁNH

| | Option 1: CSV | Option 2: API |
|---|--------------|---------------|
| **Setup** | 0 phút | 10 phút (1 lần) |
| **Import** | 3 bước | 1 lệnh |
| **Update data** | Export lại | Chỉ chạy script |
| **Khuyến nghị** | ⭐⭐⭐⭐⭐ Lần đầu | 🚀🚀🚀🚀🚀 Nếu update nhiều |

---

**🎉 CHỌN PHƯƠNG PHÁP NÀO CŨNG ĐƯỢC!**

**Lần đầu → Dùng CSV (nhanh)**  
**Update nhiều → Setup API (tiện lợi)**

