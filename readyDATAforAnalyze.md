# 📋 DATA PREPARATION FOR ANALYZE FEATURE

> **Mục đích:** Thu thập data để xây dựng tính năng "Gợi ý điều trị & khắc phục" cho GreenGrow AI

---

## 📊 3 SHEETS FORMAT (THỰC TẾ ĐANG SỬ DỤNG)

### **1. THUOC** (Products - ✅ In Progress)
```
STT | Tên sản phẩm | Hoạt chất | Nhà SX | Dùng cho bệnh | Dùng cho cây | Liều lượng | Cách dùng | Giá | Image URL | Nguồn
```

### **2. SINHHOC** (Biological Methods - ✅ In Progress)
```
STT | Tên phương pháp | Dùng cho bệnh | Vật liệu cần thiết | Cách thực hiện | Thời gian | Hiệu quả (%) | Nguồn | Verified
```

### **3. CANHTAC** (Cultural Practices - 🟡 To Do)
```
STT | Danh mục | Hành động | Mô tả chi tiết | Ưu tiên | Áp dụng cho | Nguồn
```

---

## 🎯 YÊU CẦU TỔNG QUAN - SIMPLIFIED

**Chỉ cần chuẩn bị 3 TABLES chính:**

| # | Table Name | Mục đích | Số lượng | Phương pháp | Thời gian |
|---|------------|----------|----------|-------------|-----------|
| **1** | **Products** | Thuốc BVTV (hóa học) | 30-50 | ✋ Thủ công | 3-4 giờ |
| **2** | **Biological_Methods** | Phương pháp sinh học | 10-15 | 🤖 GPT 50% + Verify | 45 phút |
| **3** | **Cultural_Practices** | Biện pháp canh tác | 20-30 | 🤖 GPT 95% | 15 phút |

**Tổng thời gian ước tính:** 4-5 giờ (thay vì 8 giờ!)

**Người thực hiện:** Frontend Developer / Data Collector

---

## 📊 CHI TIẾT 3 TABLES

### **1. PRODUCTS TABLE (THUOC)** ✋ (PHẢI THỦ CÔNG - 3-4 giờ)

> ⚠️ **KHÔNG ĐƯỢC DÙNG GPT** - Vì GPT có thể hallucinate tên sản phẩm, liều lượng sai → nguy hiểm!

**Format:** Google Sheets hoặc Excel

**Columns (Simplified - theo format thực tế):**
```
STT | Tên sản phẩm | Hoạt chất | Nhà SX | Dùng cho bệnh | Dùng cho cây | Liều lượng | Cách dùng | Giá | Image URL | Nguồn
```

**Ví dụ thực tế (từ sheet đang làm):**
```
1 | Apron® XL 350 ES | Metalaxyl-M (350 g/L) | Syngenta Vietnam Ltd | Mốc sương (Bạch tạng) gây hại hạt giống ngô | Ngô (Bắp) | 50–100 ml/100 kg hạt giống | Pha 50–100 ml thuốc với 500 ml nước, trộn đều cho 100 kg hạt giống | N/A | (chưa thêm) | Syngenta Vietnam + NongNghiepTayNguyen.vn

2 | Score 250EC | Difenoconazole (250g/L) | Syngenta | Phấn trắng, Đốm lá | Cà chua, Ớt | 0.5-0.8 ml/lít | Phun đều lên lá | 150,000-200,000 | /images/products/score-250ec.jpg | Syngenta Vietnam (2024)

3 | Kasumin 2L | Kasugamycin (2%) | Hokko | Đốm lá vi khuẩn | Cà chua | 2-3 ml/lít | Phun lên lá và thân | 120,000-150,000 | /images/products/kasumin-2l.jpg | Hokko Japan (2024)
```

**Nguồn thu thập:**
- ✅ https://www.syngenta.com.vn/product-finder
- ✅ https://www.cropscience.bayer.vn/san-pham
- ✅ https://www.fmcagro.com.vn/products
- ✅ http://www.ppd.gov.vn/ (Cục Bảo vệ Thực vật - để verify sản phẩm được phép)

**Bao gồm:**
- Thuốc trừ nấm (fungicides)
- Thuốc trừ vi khuẩn (bactericides)
- Thuốc trừ sâu (insecticides) - nếu cần

**Lưu ý:**
- ✅ Chỉ lấy sản phẩm CÓ THẬT, có bán tại Việt Nam
- ✅ Phải có nguồn tham khảo rõ ràng
- ✅ Ưu tiên sản phẩm phổ biến, dễ mua
- ❌ KHÔNG bịa đặt thông tin
- ❌ KHÔNG dùng GPT để generate sản phẩm

---

### **2. BIOLOGICAL_METHODS TABLE (SINHHOC)** 🤖 (GPT 50% + VERIFY - 45 phút)

> ⚡ **CÓ THỂ DÙNG GPT 50%!** Nhưng phải verify với FAO/CABI

**Format:** Google Sheets hoặc Excel

**Columns (theo format thực tế):**
```
STT | Tên phương pháp | Dùng cho bệnh | Vật liệu cần thiết | Cách thực hiện | Thời gian | Hiệu quả (%) | Nguồn | Verified
```

**Ví dụ thực tế (từ sheet đang làm):**
```
1 | Sử dụng Trichoderma | Nấm đất, thối rễ, héo rũ | Chế phẩm Trichoderma sp., nước sạch | Pha 10g Trichoderma với 10 lít nước → tưới đều vào gốc cây. Lặp lại sau 7 ngày. | 2–3 tuần | 60–70% | FAO IPM Guidelines (2023) | ✓

2 | Dùng tỏi tươi | Đốm lá vi khuẩn | 50g tỏi, Xà phòng, 1L nước | Giã nhỏ 50g tỏi, ngâm trong 1L nước 24h, thêm 1 thìa xà phòng, lọc và phun lên lá | 1 tuần | 40-50% | Viện BVTV - Phương pháp hữu cơ (2023) | ✓

3 | Dùng nước vo gạo lên men | Tăng sức đề kháng | Nước vo gạo, Đường | Thu nước vo gạo (2L), thêm 2 thìa đường, để 5-7 ngày, pha loãng 1:10, tưới gốc | 2 tuần | 30-40% | Canh tác hữu cơ truyền thống | ✓
```

**Bao gồm:**
- Vi sinh vật có lợi (Trichoderma, Bacillus...)
- Chế phẩm tự nhiên (tỏi, ớt, neem...)
- Mẹo dân gian (nước vo gạo, vỏ chuối...)

**🤖 PROMPT CHO GPT:**
```
Đề xuất 15 phương pháp sinh học (không dùng hóa chất) để trị bệnh cây trồng phổ biến tại Việt Nam.

Bao gồm:
- Sử dụng vi sinh vật có lợi (Trichoderma, Bacillus...)
- Dùng thực vật (tỏi, ớt, lá neem...)
- Phương pháp truyền thống (nước vo gạo...)

Format JSON:
{
  "methods": [
    {
      "name": "Sử dụng Trichoderma",
      "diseases": "Bệnh nấm đất",
      "materials": "Trichoderma sp., Nước sạch",
      "steps": "1. Pha 10g...\n2. Tưới vào gốc...",
      "timeframe": "2-3 tuần",
      "effectiveness": "60-70%",
      "source": "FAO IPM Guidelines (2022)"
    }
  ]
}

Yêu cầu:
- Practical, dễ áp dụng tại Việt Nam
- Có nguồn (FAO, CABI, best practices)
- Hiệu quả phải realistic (không quá 80%)
```

**Nguồn verify:**
- ✅ http://www.fao.org/agriculture/crops (FAO Integrated Pest Management)
- ✅ http://www.ipp.ac.vn/ (Viện Bảo vệ Thực vật)
- ✅ https://www.cabi.org/isc (CABI Crop Protection)

**Workflow:**
1. **Paste prompt vào GPT** (5 phút)
2. **Copy output vào Sheet** (5 phút)
3. **Cross-check với FAO/CABI** (30 phút)
4. **Fix sai sót** (10 phút)

---

### **3. CULTURAL_PRACTICES TABLE** 🤖 (GPT 95% - 15 phút)

> ⚡ **CÓ THỂ DÙNG GPT 95%!** - GPT biết best practices nông nghiệp

**Format:** Google Sheets hoặc Excel

**Columns (theo format thực tế):**
```
STT | Danh mục | Hành động | Mô tả chi tiết | Ưu tiên | Áp dụng cho | Nguồn
```

**5 Danh mục chính:**
1. **Đất (Soil)** - 6 biện pháp
2. **Nước (Water)** - 6 biện pháp
3. **Phân bón (Fertilizer)** - 6 biện pháp
4. **Ánh sáng & Thông gió (Light & Air)** - 6 biện pháp
5. **Khoảng cách & Mật độ (Spacing & Density)** - 6 biện pháp

**Ví dụ thực tế (từ sheet đang làm):**
```
1 | Đất | Nâng luống & rãnh thoát nước | Tạo luống cao 20–30 cm; rãnh giữa luống rộng 30 cm, sâu 20 cm để thoát nước sau mưa ≥50 mm; mặt luống hơi lồi để nước không đọng. | High | Cà chua, Ớt, Dưa leo, Dưa hấu | FAO Best Practices (2022); Viện BVTV (2023)

2 | Nước | Tưới vào sáng sớm | Tưới nước vào lúc 6-7h sáng, tránh tưới vào chiều tối (sau 16h) vì lá ướt qua đêm dễ gây nấm bệnh. Lượng nước: 3-5L/cây/ngày | Medium | Tất cả cây trồng | Viện BVTV - Kỹ thuật tưới (2023)

3 | Phân bón | Bổ sung phân Kali | Tăng lượng K (potassium) 10-15kg K2O/ha để cây khoẻ hơn, chống chịu bệnh tốt hơn. Bón vào giai đoạn ra hoa và đậu quả | High | Cây bị bệnh nấm, bệnh đốm lá | Sở NN&PTNT Đà Nẵng (2024)

4 | Ánh sáng | Tăng thông gió | Cắt tỉa lá già, lá bệnh. Tăng khoảng cách giữa các cây (từ 30cm lên 40-50cm) để ánh sáng và gió đi qua, giảm độ ẩm | Medium | Cây trồng trong nhà lưới, vùng ẩm ướt | Viện BVTV (2023)

5 | Khoảng cách | Giãn mật độ trồng | Giảm mật độ từ 40,000 cây/ha xuống 30,000 cây/ha để giảm độ ẩm, tránh lây lan bệnh nhanh | Low | Vùng mưa nhiều, độ ẩm cao | FAO IPM Guidelines (2022)
```

**🤖 PROMPT CHO GPT:**
```
Hãy tạo 30 biện pháp canh tác để phòng/trị bệnh cây trồng, chia thành 5 danh mục:

1. Đất (Soil) - 6 biện pháp
2. Nước (Water) - 6 biện pháp  
3. Phân bón (Fertilizer) - 6 biện pháp
4. Ánh sáng (Light) - 6 biện pháp
5. Khoảng cách (Spacing) - 6 biện pháp

Format JSON:
{
  "practices": [
    {
      "category": "Đất",
      "action": "Cải thiện thoát nước",
      "description": "Tạo luống cao 20-30cm, đào rãnh thoát nước giữa luống để tránh úng nước",
      "priority": "High",
      "applyFor": "Cà chua, Ớt, Dưa",
      "source": "FAO Best Practices (2022)"
    }
  ]
}

Yêu cầu:
- Practical, dễ áp dụng tại Việt Nam
- Có nguồn (FAO, CABI, Viện BVTV)
- Ưu tiên cao cho biện pháp hiệu quả
- Bao gồm số liệu cụ thể (cm, kg/ha, độ pH...)
```

**Nguồn (để ghi vào Sheet):**
- ✅ FAO Best Practices (2022)
- ✅ Viện BVTV - Kỹ thuật canh tác (2023)
- ✅ http://www.ipp.ac.vn/
- ✅ Sở NN&PTNT các tỉnh

**Workflow:**
1. **Paste prompt vào GPT** (5 phút)
2. **Copy output vào Sheet** (5 phút)
3. **Review nhanh** (5 phút)
4. **Xong!**

---

## 🖼️ HÌNH ẢNH SẢN PHẨM (30-50 ảnh)

> ⚠️ **PHẢI THỦ CÔNG** - GPT không thể tạo ảnh thật sản phẩm

**Format:** JPG/PNG files

**Yêu cầu:**
- Size: 300x300px (recommended)
- Naming convention: `product-name-lowercase.jpg`
  - Ví dụ: `score-250ec.jpg`, `kasumin-2l.jpg`
- Chất lượng: Rõ nét, không watermark

**Cấu trúc thư mục:**
```
images/
  products/
    score-250ec.jpg
    kasumin-2l.jpg
    nordox-75wg.jpg
    amistar-top.jpg
    antracol-wp.jpg
    ...
    placeholder.png  (fallback image)
```

**Cách thu thập:**
1. Vào website chính thức (Syngenta, Bayer, etc.)
2. Right-click ảnh sản phẩm → "Save image as..."
3. Hoặc Right-click → "Copy image address" → Paste URL vào Sheet

**Ghi chú credit:**
```
Ảnh: [Nguồn]
- Ví dụ: "Ảnh: Syngenta Vietnam"
- Ví dụ: "Ảnh: Bayer CropScience"
```

---

## 🗂️ CẤU TRÚC GOOGLE SHEETS - SIMPLIFIED

**Tạo 1 Google Sheets với 5 tabs:**

### **Tab 1: Products** ⭐ (30-50 rows)
30-50 sản phẩm thuốc BVTV với full info

### **Tab 2: Biological_Methods** ⭐ (10-15 rows)
10-15 phương pháp sinh học

### **Tab 3: Cultural_Practices** ⭐ (20-30 rows)
20-30 biện pháp canh tác (6 biện pháp mỗi danh mục)

### **Tab 4: Images_Tracking** (optional)
```
| Product_Name | Image_Filename | Image_URL | Credit | Downloaded |
| Score 250EC | score-250ec.jpg | /images/products/score-250ec.jpg | Syngenta Vietnam | ✓ |
```

### **Tab 5: Sources_References** (optional)
```
| Source_Name | URL | Type | Last_Checked |
| Syngenta Vietnam | https://www.syngenta.com.vn | Official Website | 2024-11-18 |
| Cục BVTV | http://www.ppd.gov.vn | Government | 2024-11-18 |
```

---

## ⏱️ TIMELINE - OPTIMIZED WITH GPT

### **TOTAL: 4-5 giờ** (thay vì 8 giờ!)

```
┌─────────────────────────────────────────┐
│  📋 TABLE 1: PRODUCTS                   │
│  ✋ Manual                               │
│  ⏱️  3-4 giờ                            │
│  - Thu thập 30 sản phẩm (2h)            │
│  - Download 30 ảnh (1.5h)               │
│  - Verify (30 phút)                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📋 TABLE 2: BIOLOGICAL METHODS         │
│  🤖 GPT 50% + Verify                    │
│  ⏱️  45 phút                            │
│  - GPT generate (5 phút)                │
│  - Copy vào Sheet (5 phút)              │
│  - Verify với FAO/CABI (30 phút)        │
│  - Fix (10 phút)                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📋 TABLE 3: CULTURAL PRACTICES         │
│  🤖 GPT 95%                             │
│  ⏱️  15 phút                            │
│  - GPT generate (5 phút)                │
│  - Copy vào Sheet (5 phút)              │
│  - Review (5 phút)                      │
└─────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 4-5 giờ ✅
```

---

## 📊 SUMMARY - PHƯƠNG PHÁP THU THẬP

| Data Type | GPT? | Manual? | Thời gian | Lý do |
|-----------|------|---------|-----------|-------|
| **Products** | ❌ | ✅ 100% | 3-4h | GPT có thể hallucinate → nguy hiểm |
| **Images** | ❌ | ✅ 100% | included | GPT không tạo ảnh thật |
| **Biological Methods** | ⚠️ 50% | ✅ 50% | 45min | GPT suggest, phải verify |
| **Cultural Practices** | ✅ 95% | ✅ 5% | 15min | GPT biết best practices |

---

## 🌐 NGUỒN CHÍNH THỨC (Bookmark)

### **Thuốc BVTV:**
- ✅ Syngenta Vietnam: https://www.syngenta.com.vn/product-finder
- ✅ Bayer CropScience: https://www.cropscience.bayer.vn/san-pham
- ✅ FMC Vietnam: https://www.fmcagro.com.vn/products
- ✅ Cục Bảo vệ Thực vật: http://www.ppd.gov.vn/

### **Hướng dẫn kỹ thuật:**
- ✅ Viện Bảo vệ Thực vật: http://www.ipp.ac.vn/
- ✅ FAO: http://www.fao.org/agriculture/crops
- ✅ CABI: https://www.cabi.org/isc

### **Tài liệu địa phương:**
- ✅ Sở NN&PTNT Đà Nẵng: https://sonnptnt.danang.gov.vn/
- ✅ Sở NN TP.HCM: http://www.sonongnghiep.hochiminhcity.gov.vn/

---

## 📤 DELIVERABLES (Gửi cho Backend)

**Khi hoàn thành, gửi:**

### **1. Google Sheets Link**
- Share với quyền "View" hoặc Export CSV (3 files: `products.csv`, `biological_methods.csv`, `cultural_practices.csv`)

### **2. Images Folder (ZIP)**
```
GreenGrow_Product_Images.zip
  └── images/
      └── products/
          ├── score-250ec.jpg
          ├── kasumin-2l.jpg
          ├── nordox-75wg.jpg
          └── ...
          └── placeholder.png
```

### **3. Sources List (TXT)**
```
sources.txt:
- Syngenta Vietnam: https://www.syngenta.com.vn (Accessed: 2024-11-18)
- Bayer CropScience: https://www.cropscience.bayer.vn (Accessed: 2024-11-18)
- Cục BVTV: http://www.ppd.gov.vn (Accessed: 2024-11-18)
...
```

---

## ✅ QUALITY CHECKLIST

**Trước khi gửi, kiểm tra:**

### **Products (MUST HAVE):**
- [ ] Đủ 30 sản phẩm (minimum)
- [ ] Mỗi sản phẩm có đầy đủ: Tên, Hoạt chất, Liều lượng, Nguồn
- [ ] Không có sản phẩm trùng lặp
- [ ] Mọi thông tin đều có citation/nguồn
- [ ] Column "Verified" = ✓
- [ ] KHÔNG có thông tin bịa đặt

### **Images (MUST HAVE):**
- [ ] Đủ 30 hình ảnh (1 ảnh/sản phẩm)
- [ ] Filename khớp với tên sản phẩm
- [ ] Format: JPG/PNG
- [ ] Có placeholder.png (fallback)
- [ ] Mỗi ảnh có credit rõ ràng

### **Biological Methods (SHOULD HAVE):**
- [ ] Đủ 10 phương pháp (minimum)
- [ ] Có cách thực hiện chi tiết (step-by-step)
- [ ] Có hiệu quả ước tính (%)
- [ ] Có nguồn tham khảo
- [ ] Đã verify với FAO/CABI (không chỉ dựa GPT)

### **Cultural Practices (SHOULD HAVE):**
- [ ] Đủ 20 biện pháp (minimum)
- [ ] Cover đủ 5 categories: Đất, Nước, Phân, Ánh sáng, Khoảng cách
- [ ] Mô tả cụ thể, dễ hiểu
- [ ] Có nguồn tham khảo

---

## 🎯 PRIORITY

### **MUST HAVE (Bắt buộc - Priority 1):**
1. ✅ 30 sản phẩm thuốc với full info
2. ✅ 30 hình ảnh sản phẩm
3. ✅ Citations/nguồn rõ ràng cho mọi thông tin

### **SHOULD HAVE (Nên có - Priority 2):**
4. ✅ 10 phương pháp sinh học
5. ✅ 20 biện pháp canh tác

### **NICE TO HAVE (Tốt nếu có - Priority 3):**
6. ⭐ 50 sản phẩm (thay vì 30)
7. ⭐ 15 phương pháp sinh học (thay vì 10)
8. ⭐ 30 biện pháp canh tác (thay vì 20)

---

## 📝 NOTES & TIPS

### **Tips thu thập nhanh:**
- ✅ Mở nhiều tabs cùng lúc (Syngenta, Bayer, FMC)
- ✅ Copy-paste trực tiếp từ website vào Sheet
- ✅ Dùng Right-click → "Copy image address" thay vì download thủ công
- ✅ Verify thông tin cross-check giữa nhiều nguồn
- ✅ **DÙNG GPT cho Biological Methods & Cultural Practices để tiết kiệm 2-3 giờ!**

### **Tránh:**
- ❌ Sản phẩm không rõ nguồn gốc
- ❌ Thông tin bịa đặt hoặc không có citation
- ❌ Hình ảnh không rõ nét hoặc có watermark
- ❌ Liều lượng mơ hồ ("ít", "nhiều" → phải có số cụ thể)
- ❌ **Dùng GPT để generate sản phẩm thuốc (rất nguy hiểm!)**

### **Nếu không tìm được thông tin:**
- ✅ Đánh dấu "N/A" hoặc để trống
- ✅ Ghi chú vào column "Notes"
- ✅ Báo cho Backend developer biết để bổ sung sau

---

## 🚀 GETTING STARTED

### **Step 1: Setup (10 phút)**
1. Tạo Google Sheets mới: "GreenGrow - Product Database"
2. Tạo 5 tabs: Products, Biological_Methods, Cultural_Practices, Images_Tracking, Sources_References
3. Copy headers từ template trên
4. Bookmark các website nguồn

### **Step 2: Products + Images (3-4 giờ - PHẢI THỦ CÔNG)**
1. Vào Syngenta.com.vn/product-finder
2. Chọn sản phẩm phổ biến đầu tiên (VD: Score 250EC)
3. Copy thông tin vào Sheet
4. Right-click ảnh → Save hoặc Copy URL
5. Lặp lại cho 29 sản phẩm còn lại

### **Step 3: Biological Methods (45 phút - GPT + VERIFY)**
1. Paste prompt vào ChatGPT/Claude (5 phút)
2. Copy output vào Sheet (5 phút)
3. Cross-check với FAO/CABI (30 phút)
4. Fix sai sót (10 phút)

### **Step 4: Cultural Practices (15 phút - GPT 95%)**
1. Paste prompt vào ChatGPT/Claude (5 phút)
2. Copy output vào Sheet (5 phút)
3. Review nhanh (5 phút)

### **Step 5: Verify & Export (15 phút)**
1. Review toàn bộ data
2. Check "Verified" column
3. Export CSV hoặc Share link
4. ZIP images folder
5. Gửi cho Backend developer

---

## 🤖 GPT PROMPTS - COPY & PASTE

### **Prompt 1: Biological Methods**
```
Đề xuất 15 phương pháp sinh học (không dùng hóa chất) để trị bệnh cây trồng phổ biến tại Việt Nam.

Bao gồm:
- Sử dụng vi sinh vật có lợi (Trichoderma, Bacillus subtilis, Pseudomonas fluorescens...)
- Dùng thực vật (tỏi, ớt, lá neem, vỏ bưởi...)
- Phương pháp truyền thống (nước vo gạo lên men, dịch phân compost...)

Format JSON:
{
  "methods": [
    {
      "name": "Sử dụng Trichoderma harzianum",
      "diseases": "Bệnh nấm đất, thối gốc",
      "materials": "10g Trichoderma sp., 10L nước sạch",
      "steps": "1. Pha 10g trichoderma với 10 lít nước\n2. Tưới vào gốc cây (500ml/cây)\n3. Lặp lại sau 7-10 ngày\n4. Áp dụng 3-4 lần liên tiếp",
      "timeframe": "2-3 tuần",
      "effectiveness": "60-70%",
      "source": "FAO IPM Guidelines (2022)"
    }
  ]
}

Yêu cầu:
- Practical, dễ áp dụng tại Việt Nam
- Có nguồn (FAO, CABI, Viện BVTV)
- Hiệu quả phải realistic (20-70%, không quá 80%)
- Bao gồm số liệu cụ thể (gram, lít, ngày)
- Ưu tiên phương pháp đã được nghiên cứu khoa học
```

### **Prompt 2: Cultural Practices**
```
Hãy tạo 30 biện pháp canh tác để phòng/trị bệnh cây trồng, chia thành 5 danh mục:

1. Đất (Soil) - 6 biện pháp
2. Nước (Water) - 6 biện pháp  
3. Phân bón (Fertilizer) - 6 biện pháp
4. Ánh sáng (Light) - 6 biện pháp
5. Khoảng cách (Spacing) - 6 biện pháp

Format JSON:
{
  "practices": [
    {
      "category": "Đất",
      "action": "Cải thiện thoát nước",
      "description": "Tạo luống cao 20-30cm, đào rãnh thoát nước giữa luống (rộng 30cm, sâu 20cm) để tránh úng nước và hạn chế bệnh thối rễ",
      "priority": "High",
      "applyFor": "Cà chua, Ớt, Dưa leo",
      "source": "FAO Best Practices (2022)"
    },
    {
      "category": "Nước",
      "action": "Tưới vào sáng sớm",
      "description": "Tưới nước vào lúc 6-7h sáng, tránh tưới vào chiều tối (sau 16h) vì lá ướt qua đêm dễ gây nấm bệnh",
      "priority": "Medium",
      "applyFor": "Tất cả cây trồng",
      "source": "Viện BVTV - Kỹ thuật tưới (2023)"
    }
  ]
}

Yêu cầu:
- Practical, dễ áp dụng tại Việt Nam
- Có nguồn (FAO, CABI, Viện BVTV, Sở NN&PTNT)
- Ưu tiên cao (High) cho biện pháp hiệu quả nhất
- Bao gồm số liệu cụ thể (cm, kg/ha, độ pH, giờ trong ngày...)
- Dễ hiểu, nông dân có thể áp dụng ngay
```

---

## 📞 CONTACT

**Nếu có thắc mắc:**
- Backend Developer: [Tên/Email]
- Project Manager: [Tên/Email]

**Deadline:** [Ngày cần hoàn thành]

---

## 📚 REFERENCES

**Documentation:**
- Plant.id API: https://plant.id/
- OpenAI GPT-4: https://platform.openai.com/docs

**Academic Papers:**
- FAO IPM Guidelines: http://www.fao.org/agriculture/crops
- CABI Crop Protection: https://www.cabi.org/cpc

**Government:**
- Cục Bảo vệ Thực vật: http://www.ppd.gov.vn/
- Viện Bảo vệ Thực vật: http://www.ipp.ac.vn/

---

## 🎯 FINAL SUMMARY

**Chỉ cần 3 tables + Images:**

| Item | Priority | Method | Time | Status |
|------|----------|--------|------|--------|
| Products table (THUOC) | ⭐⭐⭐ Must | ✋ Manual | 2h | 🟢 In Progress |
| Product images | ⭐⭐⭐ Must | ✋ Manual | 1.5h | 🟡 To Do |
| Products verify | ⭐⭐⭐ Must | ✋ Manual | 30min | 🟡 To Do |
| Biological Methods (SINHHOC) | ⭐⭐ Should | 🤖 GPT+Verify | 45min | 🟢 In Progress |
| Cultural Practices (CANHTAC) | ⭐⭐ Should | 🤖 GPT | 15min | 🟡 To Do |
| **TOTAL** | - | - | **4-5h** | 🟡 |

---

## 📊 FORMAT THỰC TẾ ĐANG SỬ DỤNG

### **Sheet 1: THUOC (Products)**
```
STT | Tên sản phẩm | Hoạt chất | Nhà SX | Dùng cho bệnh | Dùng cho cây | Liều lượng | Cách dùng | Giá | Image URL | Nguồn
```
✅ **Example:** Apron® XL 350 ES | Metalaxyl-M (350 g/L) | Syngenta Vietnam Ltd | Mốc sương | Ngô | 50–100 ml/100 kg | ...

### **Sheet 2: SINHHOC (Biological Methods)**
```
STT | Tên phương pháp | Dùng cho bệnh | Vật liệu cần thiết | Cách thực hiện | Thời gian | Hiệu quả (%) | Nguồn | Verified
```
✅ **Example:** Sử dụng Trichoderma | Nấm đất, thối rễ | Trichoderma sp., nước | Pha 10g với 10L nước, tưới gốc | 2–3 tuần | 60–70% | FAO (2023) | ✓

### **Sheet 3: CANHTAC (Cultural Practices)**
```
STT | Danh mục | Hành động | Mô tả chi tiết | Ưu tiên | Áp dụng cho | Nguồn
```
✅ **Example:** Đất | Nâng luống & rãnh thoát nước | Tạo luống cao 20–30 cm, rãnh rộng 30cm... | High | Cà chua, Ớt | FAO (2022)

**Flow khi hoàn thành:**
```
Plant.id phát hiện bệnh
    ↓
Backend tra database
    ↓
Trả về:
  1. Thuốc (Products table)
  2. Phương pháp sinh học (Biological_Methods table)
  3. Biện pháp canh tác (Cultural_Practices table)
    ↓
GPT viết lại dễ hiểu cho user
    ↓
User nhận gợi ý đầy đủ ✅
```

---

**Last Updated:** 2024-11-18
**Version:** 2.1 - Updated with Actual Format from Sheets
**Status:** 🟢 In Progress (2/3 sheets completed)

**📝 PROGRESS:**
- ✅ Sheet 1: THUOC (Products) - In Progress
- ✅ Sheet 2: SINHHOC (Biological Methods) - In Progress  
- 🟡 Sheet 3: CANHTAC (Cultural Practices) - To Do (15 phút với GPT)

**🚀 CÒN 1 SHEET NỮA LÀ XONG! DÙNG GPT CHỈ MẤT 15 PHÚT!**
