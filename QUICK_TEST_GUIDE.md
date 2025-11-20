# ⚡ QUICK TEST GUIDE - Frontend Integration

**5 phút để test toàn bộ tính năng!**

---

## 🚀 START SERVERS

### **Terminal 1: Backend**
```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
npm run dev
```

**Expected output:**
```
Server running on http://0.0.0.0:4000
✅ MongoDB Connected
```

---

### **Terminal 2: Frontend**
```bash
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/frontend
npm run dev
```

**Expected output:**
```
VITE ready in XXXms
Local: http://localhost:5173/
```

---

## 🧪 TEST SCENARIOS

### **✅ TEST 1: Diseased Plant (Cây có bệnh)**

**Steps:**
1. Open browser: http://localhost:5173
2. Login với: `huynhthinh61@gmail.com` / `Thinh@123`
3. Click "Chat Analyze" (icon chat với cây)
4. Upload hình ảnh cây có bệnh (ví dụ: cà chua bị nấm)
5. (Optional) Thêm text: "Cây này bị bệnh gì?"

**Expected Result:**
```
✅ Chat panel: 
   - Bot trả lời về bệnh
   - Có hình ảnh trong chat

✅ Analysis Panel (bên phải):
   📊 Phân tích tổng quan:
      - "Có dấu hiệu [tên bệnh] (XX% tin cậy)"
      - Loại cây: [tên cây]
      - Mô tả bệnh

   🩺 Gợi ý Điều trị & Khắc phục:
      - Tab 1: 💊 Thuốc Hóa học (có items)
      - Tab 2: 🌿 Phương pháp Sinh học (có items)
      - Tab 3: 🌾 Biện pháp Canh tác (có items)

   📋 Thông tin Bổ sung:
      - Product cards với images
      - Click vào → Modal hiển thị:
         • Cách dùng
         • Liều lượng
         • Tần suất
         • Lưu ý
         • Thời gian cách ly
```

**Screenshot checklist:**
- [ ] Chat messages hiển thị đúng
- [ ] OverviewCard có disease info
- [ ] 3 tabs treatments hiển thị
- [ ] Products có trong Additional Info
- [ ] Modal mở được khi click product

---

### **✅ TEST 2: Healthy Plant (Cây khỏe mạnh)**

**Steps:**
1. Trong cùng chat session
2. Upload hình ảnh cây khỏe mạnh
3. (Optional) Text: "Cây này khỏe mạnh không?"

**Expected Result:**
```
✅ Chat panel: 
   - Bot xác nhận cây khỏe mạnh

✅ Analysis Panel:
   📊 Phân tích tổng quan:
      - "Không phát hiện bệnh rõ ràng" ✅
      - Icon màu xanh (CheckCircle)
      - Loại cây: [tên cây]

   🩺 Gợi ý Điều trị & Khắc phục:
      - CHỈ 1 tab: 🌾 Biện pháp Chăm sóc ✅
      - Có 10 items về chăm sóc cây

   📋 Thông tin Bổ sung:
      - EMPTY (không có sản phẩm) ✅
```

**Screenshot checklist:**
- [ ] "Không phát hiện bệnh" hiển thị
- [ ] Chỉ có 1 tab "Biện pháp Chăm sóc"
- [ ] Additional Info trống
- [ ] Icon check màu xanh

---

### **✅ TEST 3: Text-only Chat (Chỉ nhắn tin)**

**Steps:**
1. Trong chat, KHÔNG upload ảnh
2. Chỉ gửi text: "Cách trồng cà chua?"

**Expected Result:**
```
✅ Chat panel: 
   - Bot trả lời về cách trồng cà chua

✅ Analysis Panel:
   📊 Phân tích tổng quan:
      - "Gửi câu hỏi hoặc ảnh để bắt đầu" ✅

   🩺 Gợi ý Điều trị & Khắc phục:
      - Empty state: "Chưa có gợi ý điều trị" ✅
      - Icon AlertCircle màu xám

   📋 Thông tin Bổ sung:
      - EMPTY ✅
```

**Screenshot checklist:**
- [ ] Chat messages vẫn hiển thị
- [ ] Analysis panel hiện empty states
- [ ] Không có treatment tabs
- [ ] Không có products

---

## 🐛 COMMON ISSUES

### **Issue 1: "Failed to fetch" trong console**

**Solution:**
```bash
# Check backend đang chạy
curl http://localhost:4000/api/v1/treatments/stats

# Expected: { "success": true, "data": { ... } }
```

---

### **Issue 2: Empty treatments (có bệnh nhưng không hiện thuốc)**

**Solution:**
```bash
# Check MongoDB có data
mongosh GreenGrow --eval "
  print('Products:', db.products.countDocuments());
  print('Bio:', db.biological_methods.countDocuments());
  print('Cultural:', db.cultural_practices.countDocuments());
"

# Expected: Products: 30, Bio: 28, Cultural: 70
```

---

### **Issue 3: Treatment tabs không hiển thị**

**Check:**
1. F12 → Console → Có errors?
2. Network tab → `/chat-analyze/stream` có response?
3. Response có `treatments` array?

**Debug:**
```javascript
// In browser console:
console.log('Latest result:', 
  JSON.parse(localStorage.getItem('lastAnalysisResult'))
);
```

---

### **Issue 4: Modal không mở**

**Check:**
```tsx
// Verify ProductDetailModal is imported
// Check onClick handler in AdditionalInfoCard
// Check modal state management
```

---

## 📊 VERIFICATION CHECKLIST

### **Backend:**
- [ ] Server running on port 4000
- [ ] MongoDB connected (127.0.0.1)
- [ ] `/api/v1/treatments/stats` returns 128 documents
- [ ] No errors in backend terminal

### **Frontend:**
- [ ] Vite running on port 5173
- [ ] No build errors
- [ ] Can login successfully
- [ ] Chat Analyze page loads

### **Data:**
- [ ] MongoDB has 30 products
- [ ] MongoDB has 28 biological methods
- [ ] MongoDB has 70 cultural practices
- [ ] Total: 128 treatment documents

### **Features:**
- [ ] Upload image works
- [ ] Plant.id API responds
- [ ] Treatments display for diseased plant
- [ ] Only care practices for healthy plant
- [ ] Empty states for text-only
- [ ] Product modal opens
- [ ] Tabs switch correctly

---

## 🎯 ACCEPTANCE CRITERIA

**✅ All tests passed if:**

1. **Diseased Plant:**
   - 3 treatment tabs visible
   - Products in Additional Info
   - Modal opens with details

2. **Healthy Plant:**
   - 1 care practices tab only
   - No products in Additional Info
   - "Không phát hiện bệnh" message

3. **Text-only:**
   - Empty states display
   - No crashes
   - Chat still works

4. **General:**
   - No console errors
   - Smooth transitions
   - Responsive layout
   - Vietnamese text displays correctly

---

## 📸 SCREENSHOT CHECKLIST

**Take screenshots of:**
1. Diseased plant - Full analysis panel
2. Diseased plant - Thuốc Hóa học tab
3. Diseased plant - Product modal
4. Healthy plant - Chăm sóc tab
5. Text-only - Empty states
6. Mobile view (responsive)

---

## ⏱️ EXPECTED TIME

- Setup (start servers): 1 min
- Test 1 (diseased): 2 min
- Test 2 (healthy): 1 min
- Test 3 (text-only): 1 min
- **Total: ~5 minutes**

---

## 🎉 SUCCESS!

If all tests pass, you're ready to:
- ✅ Demo to stakeholders
- ✅ Deploy to staging
- ✅ Prepare for production

**🚀 HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO!**

---

**Last Updated:** 2024-11-18  
**Version:** 1.0  
**Status:** Ready for Testing

