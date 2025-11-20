# ✅ GPT RESPONSE TEMPLATE - PROFESSIONAL FORMAT

**Date:** 2024-11-18  
**Status:** ✅ Implemented

---

## 🎯 YÊU CẦU

1. ✅ Dịch tên bệnh sang tiếng Việt (không để "Fungi")
2. ✅ Thêm disclaimer về tính tham khảo
3. ✅ Đề xuất gửi thêm ảnh để nhận dạng tốt hơn
4. ✅ Format response chuyên nghiệp theo template

---

## ✅ ĐÃ IMPLEMENT

### **1. Updated GPT Prompt (`ai.service.js`)**

**Template được thêm vào system prompt:**

```
🌱 Kết quả phân tích từ hình ảnh bạn cung cấp

[Nếu không xác định được cây: "Hiện tại hệ thống không thể xác định chính xác loài cây..."]
[Nếu xác định được cây: "Cây của bạn là [TÊN TIẾNG VIỆT]."]

[Nếu có bệnh: "Tuy nhiên, dựa trên các dấu hiệu quan sát được, lá cây đang có khả năng bị nhiễm [TÊN BỆNH TIẾNG VIỆT] với độ tin cậy [X]%."]

🦠 Dấu hiệu bệnh quan sát được
[Mô tả triệu chứng...]

🌿 Gợi ý chăm sóc ban đầu
- Loại bỏ lá bị bệnh...
- Tránh tưới đọng nước...

📌 Lưu ý
Phân tích dựa trên ảnh chỉ mang tính tham khảo. Bạn có thể gửi thêm hình toàn cây hoặc mặt dưới lá để nhận dạng chính xác hơn.
```

**Instructions thêm vào:**

1. ✅ LUÔN dịch tên bệnh sang tiếng Việt
2. ✅ Nếu confidence < 70%, nhấn mạnh không thể xác định
3. ✅ LUÔN thêm disclaimer và đề xuất gửi thêm ảnh

---

### **2. Disease Name Translation**

**Backend (`plantid.js`):**
- ✅ `translateWithGPT()` tự động dịch disease name sang tiếng Việt
- ✅ GPT nhận disease name đã dịch sẵn

**GPT Prompt:**
- ✅ Nhắc nhở GPT LUÔN dùng tên tiếng Việt
- ✅ Ví dụ: "Fungi" → "bệnh nấm"

---

### **3. Analysis Context**

**Updated context passed to GPT:**

```javascript
Kết quả phân tích cây trồng từ hình ảnh:
- Loại cây: [Tên] (Không thể xác định chính xác nếu <70%)
- Độ tin cậy nhận diện cây: X% (Đáng tin cậy / Không đáng tin cậy)
- Bệnh phát hiện: [Tên tiếng Việt] (X% tin cậy)
- Mô tả bệnh: [Description]

LƯU Ý QUAN TRỌNG:
- Plant identification không đáng tin cậy → KHÔNG đưa ra tên cây cụ thể
- LUÔN dịch tên bệnh sang tiếng Việt
- LUÔN thêm disclaimer và đề xuất gửi thêm ảnh
```

---

## 📊 EXPECTED OUTPUT

### **Scenario 1: Low Confidence (< 70%)**

**Input:**
- Plant: "Không thể xác định" (57% confidence)
- Disease: "Bệnh nấm" (57% confidence)

**Expected GPT Response:**
```
🌱 Kết quả phân tích từ hình ảnh bạn cung cấp

Hiện tại hệ thống không thể xác định chính xác loài cây, vì hình chỉ chụp một phần lá và không đủ đặc điểm nhận dạng.

Tuy nhiên, dựa trên các dấu hiệu quan sát được, lá cây đang có khả năng bị nhiễm bệnh nấm với độ tin cậy 57%.

🦠 Dấu hiệu bệnh quan sát được

Các đốm tròn nhỏ màu vàng nâu, viền hơi sẫm, phân bố rải rác trên mặt lá. Đây là triệu chứng thường gặp trong nhóm bệnh đốm lá do nấm.

🌿 Gợi ý chăm sóc ban đầu

- Loại bỏ lá bị bệnh để tránh lây lan
- Tránh tưới đọng nước lên lá
- Giảm ẩm, tăng thông thoáng
- Đảm bảo cây đủ ánh sáng
- Có thể sử dụng thuốc trừ nấm phù hợp nếu tình trạng nặng

📌 Lưu ý

Phân tích dựa trên ảnh chỉ mang tính tham khảo. Bạn có thể gửi thêm hình toàn cây hoặc mặt dưới lá để nhận dạng chính xác hơn.
```

---

### **Scenario 2: High Confidence (≥ 70%)**

**Input:**
- Plant: "Cà chua" (85% confidence)
- Disease: "Đốm lá" (75% confidence)

**Expected GPT Response:**
```
🌱 Kết quả phân tích từ hình ảnh bạn cung cấp

Cây của bạn là Cà chua.

Tuy nhiên, dựa trên các dấu hiệu quan sát được, lá cây đang có khả năng bị nhiễm đốm lá với độ tin cậy 75%.

🦠 Dấu hiệu bệnh quan sát được

[...mô tả triệu chứng...]

🌿 Gợi ý chăm sóc ban đầu

[...]

📌 Lưu ý

Phân tích dựa trên ảnh chỉ mang tính tham khảo. Bạn có thể gửi thêm hình toàn cây hoặc mặt dưới lá để nhận dạng chính xác hơn.
```

---

## ✅ CHECKLIST

- [x] GPT prompt updated với template format
- [x] Disease name translation instructions added
- [x] Disclaimer instructions added
- [x] "Gửi thêm ảnh" suggestion added
- [x] Low confidence handling (< 70%)
- [x] Analysis context includes reliability flags
- [x] Backend translates disease names before passing to GPT

---

## 🧪 TEST

**Test với ảnh có confidence thấp:**

1. Upload ảnh lá có đốm
2. Check GPT response format
3. Verify:
   - ✅ "Không thể xác định" thay vì tên cây sai
   - ✅ "Bệnh nấm" thay vì "Fungi"
   - ✅ Có disclaimer
   - ✅ Có đề xuất gửi thêm ảnh
   - ✅ Format theo template với emoji

---

## 🎯 BENEFITS

1. **Chuyên nghiệp hơn** - Format rõ ràng, có cấu trúc
2. **Dễ hiểu hơn** - Tiếng Việt hoàn toàn
3. **Trung thực hơn** - Không đưa ra kết luận sai
4. **Phù hợp Capstone** - Có disclaimer, có đề xuất cải thiện

---

**🎉 GPT SẼ TỰ ĐỘNG FORMAT RESPONSE THEO TEMPLATE!**

**Backend đã restart, test lại với ảnh mới!** 🚀

---

**Last Updated:** 2024-11-18  
**Status:** ✅ Ready for Testing  
**Files Changed:** `aiAssistant/ai.service.js`

