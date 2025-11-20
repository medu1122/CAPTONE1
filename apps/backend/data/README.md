# 📂 DATA FOLDER

Thư mục này chứa các file CSV để import vào database.

---

## 📋 REQUIRED FILES

Bạn cần đặt 3 file CSV vào thư mục này:

```
data/
├── products.csv                 (từ sheet THUOC)
├── biological_methods.csv       (từ sheet SINHHOC)
└── cultural_practices.csv       (từ sheet CANHTAC)
```

---

## 📝 CSV FORMAT EXAMPLES

### **1. products.csv (Sheet THUOC)**

**Headers (dòng đầu tiên):**
```
STT,Tên sản phẩm,Hoạt chất,Nhà SX,Dùng cho bệnh,Dùng cho cây,Liều lượng,Cách dùng,Giá,Image URL,Nguồn
```

**Example row:**
```
1,Apron® XL 350 ES,Metalaxyl-M (350 g/L),Syngenta Vietnam Ltd,Mốc sương (Bạch tạng) gây hại hạt giống ngô,Ngô (Bắp),50–100 ml/100 kg hạt giống,Pha 50–100 ml thuốc với 500 ml nước,N/A,,Syngenta Vietnam + NongNghiepTayNguyen.vn
```

**Full example:**
```csv
STT,Tên sản phẩm,Hoạt chất,Nhà SX,Dùng cho bệnh,Dùng cho cây,Liều lượng,Cách dùng,Giá,Image URL,Nguồn
1,Apron® XL 350 ES,Metalaxyl-M (350 g/L),Syngenta Vietnam Ltd,Mốc sương,Ngô,50–100 ml/100 kg hạt giống,Pha 50–100 ml thuốc với 500 ml nước,N/A,,Syngenta Vietnam
2,Score 250EC,Difenoconazole 250g/L,Syngenta Vietnam,Phấn trắng,"Cà chua, Ớt",0.5-0.8 ml/lít nước,Pha thuốc với nước và phun đều,150000-200000 VNĐ,,Syngenta Vietnam
```

---

### **2. biological_methods.csv (Sheet SINHHOC)**

**Headers:**
```
STT,Tên phương pháp,Dùng cho bệnh,Vật liệu cần thiết,Cách thực hiện,Thời gian,Hiệu quả (%),Nguồn,Verified
```

**Example row:**
```
1,Sử dụng Trichoderma,"Nấm đất, Thối rễ, Héo rũ",Chế phẩm Trichoderma sp.,Pha 10g Trichoderma với 10 lít nước → tưới đều vào gốc cây,2–3 tuần,60–70%,FAO IPM Guidelines (2023),✓
```

**Full example:**
```csv
STT,Tên phương pháp,Dùng cho bệnh,Vật liệu cần thiết,Cách thực hiện,Thời gian,Hiệu quả (%),Nguồn,Verified
1,Sử dụng Trichoderma,"Nấm đất, Thối rễ",Chế phẩm Trichoderma sp.,Pha 10g với 10L nước và tưới vào gốc,2–3 tuần,60–70%,FAO IPM Guidelines (2023),✓
2,Phun nước gừng,Bệnh nấm,Gừng tươi 500g + nước 5L,Đập dập gừng và ngâm 24h rồi phun lên lá,1 tuần,40-50%,Tài liệu dân gian,✓
```

---

### **3. cultural_practices.csv (Sheet CANHTAC)**

**Headers:**
```
STT,Danh mục,Hành động,Mô tả chi tiết,Ưu tiên,Áp dụng cho,Nguồn
```

**Example row:**
```
1,Đất,Nâng luống & rãnh thoát nước,Tạo luống cao 20–30 cm; rãnh giữa luống rộng 30 cm,High,"Cà chua, Ớt, Dưa leo",FAO Best Practices (2022)
```

**Full example:**
```csv
STT,Danh mục,Hành động,Mô tả chi tiết,Ưu tiên,Áp dụng cho,Nguồn
1,Đất,Nâng luống & rãnh thoát nước,Tạo luống cao 20–30 cm để thoát nước tốt,High,"Cà chua, Ớt",FAO Best Practices (2022)
2,Nước,Tưới nhỏ giọt,Sử dụng hệ thống tưới nhỏ giọt để tiết kiệm nước,Medium,"Cà chua, Dưa hấu",Viện BVTV (2023)
3,Phân bón,Bón phân hữu cơ,Sử dụng phân compost để cải thiện đất,High,Tất cả các loại cây,Viện Thổ nhưỡng (2023)
```

---

## ⚠️ IMPORTANT NOTES

### **Multiple Values (Nhiều giá trị):**

Nếu có nhiều giá trị, cách nhau bởi dấu phẩy và bọc trong dấu ngoặc kép:

```csv
✅ ĐÚNG:
"Cà chua, Ớt, Dưa leo"

❌ SAI:
Cà chua, Ớt, Dưa leo  (sẽ bị tách thành nhiều cột)
```

### **Dấu phẩy trong text:**

Nếu text có dấu phẩy, phải bọc trong dấu ngoặc kép:

```csv
✅ ĐÚNG:
"Pha 50–100 ml thuốc với 500 ml nước, trộn đều"

❌ SAI:
Pha 50–100 ml thuốc với 500 ml nước, trộn đều  (bị tách làm 2 cột)
```

### **Vietnamese Characters:**

- ✅ File phải lưu với encoding **UTF-8**
- ✅ Google Sheets tự động export UTF-8
- ❌ Không dùng encoding khác (sẽ bị lỗi tiếng Việt)

### **Empty Fields:**

```csv
✅ ĐÚNG:
1,Product Name,Active Ingredient,,,,100000,,https://image.com,Source Name

❌ SAI:
1,Product Name,Active Ingredient,100000,https://image.com,Source Name  (thiếu cột)
```

### **Danh mục (Category) Mapping:**

Cho `cultural_practices.csv`, `Danh mục` phải là một trong các giá trị:

| Vietnamese | English (Database) |
|------------|-------------------|
| Đất | soil |
| Nước | water |
| Phân bón | fertilizer |
| Ánh sáng | light |
| Khoảng cách | spacing |

Script sẽ tự động convert.

---

## 🚀 HOW TO USE

1. **Export từ Google Sheets:**
   - File → Download → CSV (.csv)

2. **Copy vào thư mục này:**
   ```bash
   cp ~/Downloads/products.csv ./
   cp ~/Downloads/biological_methods.csv ./
   cp ~/Downloads/cultural_practices.csv ./
   ```

3. **Run import script:**
   ```bash
   cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
   node scripts/importTreatments.js
   ```

---

## 📖 MORE INFO

Xem hướng dẫn chi tiết tại: `HOW_TO_IMPORT_DATA.md`

---

**Status:** Waiting for CSV files 📥

