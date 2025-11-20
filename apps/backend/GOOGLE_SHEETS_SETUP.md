# 🔗 ĐỌC TRỰC TIẾP TỪ GOOGLE SHEETS

**Không cần export CSV thủ công!**

---

## 🎯 TỔNG QUAN

Script này đọc trực tiếp từ Google Sheets API và import vào MongoDB.

**Ưu điểm:**
- ✅ Không cần export/download CSV
- ✅ Tự động sync mỗi khi chạy script
- ✅ Chỉ cần 1 lệnh: `node scripts/importFromGoogleSheets.js`

**Nhược điểm:**
- ⚠️ Cần setup Google Cloud Service Account (5-10 phút lần đầu)

---

## 🔧 SETUP (LẦN ĐẦU TIÊN)

### **BƯỚC 1: Cài đặt package**

```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
npm install google-spreadsheet google-auth-library
```

---

### **BƯỚC 2: Tạo Google Cloud Service Account**

#### **2.1. Vào Google Cloud Console:**
https://console.cloud.google.com/

#### **2.2. Tạo hoặc chọn Project:**
- Click dropdown "Select a project" → "New Project"
- Đặt tên: `GreenGrow-Capstone`
- Click "Create"

#### **2.3. Enable Google Sheets API:**
1. Vào menu → "APIs & Services" → "Library"
2. Search: `Google Sheets API`
3. Click vào → Click "Enable"

#### **2.4. Tạo Service Account:**
1. Vào menu → "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Điền:
   - **Service account name:** `greengrow-sheets-reader`
   - **Service account ID:** (tự động tạo)
   - **Description:** `Read Google Sheets for treatment data`
4. Click "Create and Continue"
5. **Role:** Select "Viewer" (hoặc để trống)
6. Click "Done"

#### **2.5. Tạo JSON Key:**
1. Trong danh sách Service Accounts, click vào account vừa tạo
2. Tab "Keys" → "Add Key" → "Create new key"
3. Chọn "JSON" → Click "Create"
4. File JSON sẽ tự động download → **LƯU FILE NÀY AN TOÀN!**

---

### **BƯỚC 3: Share Google Sheet với Service Account**

1. Mở file JSON vừa download
2. Copy giá trị của field `client_email` (dạng: `xxx@xxx.iam.gserviceaccount.com`)
3. Mở Google Sheets của bạn (3 sheets: THUOC, SINHHOC, CANHTAC)
4. Click "Share" → Paste email vừa copy
5. **Chọn role: "Viewer"**
6. Click "Send"

✅ **Bây giờ Service Account có thể đọc Google Sheets của bạn!**

---

### **BƯỚC 4: Thêm credentials vào .env**

Mở file JSON credentials, bạn sẽ thấy:

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "xxx@xxx.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

**Thêm vào file `.env` của backend:**

```bash
# Google Sheets API Configuration
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Cách lấy các giá trị:**

1. **GOOGLE_SHEET_ID:**
   - Mở Google Sheets
   - Lấy từ URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Copy phần `{SHEET_ID}`

2. **GOOGLE_SERVICE_ACCOUNT_EMAIL:**
   - Copy từ field `client_email` trong JSON

3. **GOOGLE_PRIVATE_KEY:**
   - Copy từ field `private_key` trong JSON
   - **Quan trọng:** Phải giữ nguyên `\n` trong key!
   - Bọc trong dấu ngoặc kép: `"-----BEGIN...-----\n"`

**Ví dụ `.env`:**

```bash
GOOGLE_SHEET_ID=1abc123XYZ-def456_GHI789
GOOGLE_SERVICE_ACCOUNT_EMAIL=greengrow-sheets-reader@greengrow-capstone-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...(very long)...xyz\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 SỬ DỤNG

### **Chạy import:**

```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
node scripts/importFromGoogleSheets.js
```

**Output:**

```
🚀 Starting Google Sheets import...

📡 Connecting to MongoDB...
✅ Connected to MongoDB

🔐 Authenticating with Google Sheets API...
✅ Connected to Google Sheet: GreenGrow Treatment Data

📦 Importing products from THUOC sheet...
Found 30 rows
🗑️  Cleared existing products
✅ Imported 30 products

🌿 Importing biological methods from SINHHOC sheet...
Found 10 rows
🗑️  Cleared existing biological methods
✅ Imported 10 biological methods

🌾 Importing cultural practices from CANHTAC sheet...
Found 20 rows
🗑️  Cleared existing cultural practices
✅ Imported 20 cultural practices

==================================================
🎉 Import completed! Total: 60 documents imported
==================================================

✅ MongoDB connection closed
```

---

## ✅ VERIFY

**Check stats:**

```bash
curl http://localhost:4000/api/v1/treatments/stats
```

**Expected:**

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

## 🔄 CẬP NHẬT DATA

Khi bạn chỉnh sửa Google Sheets:

1. Chỉnh sửa trực tiếp trên Google Sheets
2. Chạy lại script: `node scripts/importFromGoogleSheets.js`
3. **Done!** Data mới đã được import

**Không cần export CSV, không cần copy files!**

---

## ⚠️ TROUBLESHOOTING

### **Error: "Missing Google Sheets credentials"**

**Solution:**
- Check `.env` có đủ 3 biến: `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- Check `GOOGLE_PRIVATE_KEY` có bọc trong dấu ngoặc kép `"..."`

---

### **Error: "The caller does not have permission"**

**Solution:**
- Check đã Share Google Sheets với Service Account email chưa
- Check role của Service Account trong Share settings là "Viewer" hoặc "Editor"

---

### **Error: "Sheet 'THUOC' not found"**

**Solution:**
- Check tên các sheet trong Google Sheets phải đúng là: `THUOC`, `SINHHOC`, `CANHTAC`
- Không có dấu cách thừa
- Case-sensitive (phân biệt chữ hoa/thường)

---

### **Error: "Cannot read property 'get' of undefined"**

**Solution:**
- Check tên các cột (headers) trong sheet phải đúng format:
  - THUOC: `Tên sản phẩm`, `Hoạt chất`, `Nhà SX`, etc.
  - SINHHOC: `Tên phương pháp`, `Dùng cho bệnh`, etc.
  - CANHTAC: `Danh mục`, `Hành động`, etc.

---

### **Error: "Invalid grant: account not found"**

**Solution:**
- Service Account có thể đã bị xóa hoặc vô hiệu hóa
- Tạo lại Service Account mới và update `.env`

---

## 🔒 BẢO MẬT

### **QUAN TRỌNG:**

1. **KHÔNG COMMIT file JSON credentials vào Git!**
   ```bash
   # Thêm vào .gitignore:
   *.json
   credentials/
   ```

2. **KHÔNG SHARE private key công khai!**

3. **Service Account chỉ nên có quyền "Viewer" cho Google Sheets**

4. **Nếu private key bị lộ:**
   - Vào Google Cloud Console
   - Xóa Service Account cũ
   - Tạo Service Account mới
   - Update `.env` với key mới

---

## 📊 SO SÁNH 2 PHƯƠNG PHÁP

| | CSV Manual | Google Sheets API |
|---|------------|-------------------|
| **Setup lần đầu** | 0 phút | 5-10 phút |
| **Mỗi lần import** | 3 bước (export, copy, run) | 1 bước (run script) |
| **Tự động hóa** | ❌ | ✅ |
| **Update data** | Phải export lại | Chỉ cần chạy script |
| **Dễ sử dụng** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (sau khi setup) |

---

## 🎯 KHUYẾN NGHỊ

**Dùng Google Sheets API nếu:**
- ✅ Bạn sẽ update data thường xuyên
- ✅ Muốn tự động hóa process
- ✅ Có nhiều người cùng làm việc với sheets
- ✅ Không ngại setup lần đầu

**Dùng CSV Manual nếu:**
- ✅ Chỉ import 1-2 lần
- ✅ Muốn đơn giản, không setup gì thêm
- ✅ Data không thay đổi nhiều

---

## 📚 REFERENCES

- **Google Sheets API Docs:** https://developers.google.com/sheets/api
- **Service Account Guide:** https://cloud.google.com/iam/docs/service-accounts
- **google-spreadsheet npm:** https://www.npmjs.com/package/google-spreadsheet

---

## ✅ CHECKLIST

Setup Google Sheets API:

- [ ] Cài package: `google-spreadsheet`, `google-auth-library`
- [ ] Tạo Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] Tạo Service Account
- [ ] Download JSON credentials
- [ ] Share Google Sheets với Service Account email
- [ ] Thêm credentials vào `.env`
- [ ] Test run: `node scripts/importFromGoogleSheets.js`
- [ ] Verify data: `curl .../treatments/stats`

---

**🎉 SETUP XONG 1 LẦN, DÙNG MÃI MÃI!**

**Sau này chỉ cần: `node scripts/importFromGoogleSheets.js` → DONE!**

---

**Last Updated:** 2024-11-18  
**Version:** 1.0  
**Script:** `scripts/importFromGoogleSheets.js`

