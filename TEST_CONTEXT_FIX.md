# 🧪 Quick Test Guide: Context Confusion Fix

## ⚡ **FAST TEST (2 minutes):**

### **Test 1: Multiple Images No Longer Confuse AI**

```bash
Step 1: Upload hình Đậu lăng
Expected: AI nói "Có thể đây là Đậu lăng (độ tin cậy 47%...)"

Step 2: NGAY SAU ĐÓ, upload hình Lúa (trong cùng session)
Expected: AI NÓI "Có thể đây là Lúa (độ tin cậy 59%...)"
          ⛔ AI KHÔNG NÓI về Đậu lăng nữa

Step 3: Check backend logs
Look for:
   📚 Loaded chat context (FILTERED for new image):
      originalMessageCount: 2
      filteredMessageCount: 0    ← Should be 0 or very few
```

---

### **Test 2: Confidence Display Fixed**

```bash
Step 1: Upload hình cây lúa bị bệnh nấm

Step 2: Check "Phân tích tổng quan" panel (bên phải)
Look for: "⚠️ Có dấu hiệu Nấm (XX% tin cậy)"

Step 3: Check backend logs
Look for: 🦠 Disease detected: Nấm (70.6%)

Step 4: Compare
Backend: 70.6%
UI Panel: Should show 71% (rounded)
         ✅ NOT 59% (which is plant confidence)
```

---

## 📋 **DETAILED TEST SCENARIOS:**

### **Scenario A: Sequential Image Uploads**

| Step | Action | Expected AI Response | Pass/Fail |
|------|--------|---------------------|-----------|
| 1 | Upload Đậu lăng | "Có thể đây là Đậu lăng (47%)" | |
| 2 | Upload Lúa | "Có thể đây là Lúa (59%)" <br>⛔ NO mention of Đậu lăng | |
| 3 | Upload Cà chua | "Đây là Cà chua (99%)" <br>⛔ NO mention of Lúa hoặc Đậu lăng | |

---

### **Scenario B: Image → Text → Image**

| Step | Action | Expected AI Response | Pass/Fail |
|------|--------|---------------------|-----------|
| 1 | Upload Cà chua | "Đây là Cà chua..." | |
| 2 | (Text) "Bệnh này nghiêm trọng không?" | Can reference Cà chua ✅ | |
| 3 | Upload Lúa (NEW image) | "Có thể đây là Lúa..." <br>⛔ Should NOT reference Cà chua anymore | |

---

### **Scenario C: Confidence Display**

| Plant | Plant Conf | Disease | Disease Conf | UI Should Show | Pass/Fail |
|-------|-----------|---------|--------------|----------------|-----------|
| Lúa | 59% | Nấm | 71% | **71%** (disease) | |
| Đậu lăng | 47% | Thiệt hại | 76% | **76%** (disease) | |
| Cà chua | 99% | (healthy) | 0% | **99%** (plant) | |

---

## 🔍 **BACKEND LOG CHECKLIST:**

When user uploads **2nd image**, you should see:

```
✅ GOOD:
📚 Loaded chat context (FILTERED for new image):
   originalMessageCount: 4
   filteredMessageCount: 0        ← ✅ Context cleared!

🌿 Calling Plant.id API for plant identification...
📊 Plant.id result: { topSuggestion: 'New Plant', confidence: X }
```

```
❌ BAD (if you see this, fix not working):
📚 Loaded chat context:
   messageCount: 4                ← ❌ Still loading old messages
   hasSession: true

📊 Context filtering: Using: 3   ← ❌ Still sending 3 old messages to GPT
```

---

## 🎯 **SUCCESS CRITERIA:**

- [ ] AI response ONLY mentions current plant, NOT previous ones
- [ ] Backend logs show `filteredMessageCount: 0` for new images
- [ ] UI confidence matches disease confidence (when disease exists)
- [ ] Backend logs show correct confidence values

---

## 🚨 **IF TEST FAILS:**

1. **Check backend restarted:**
   ```bash
   lsof -ti:4000 | xargs kill -9
   cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend && npm start
   ```

2. **Check frontend refreshed:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Clear browser cache:**
   - Or use incognito/private mode

4. **Check files modified:**
   - `chatAnalyze.service.js` (backend) - lines 333-389
   - `ChatAnalyzeContext.tsx` (frontend) - lines 520-533

---

**Test by:** [Your Name]  
**Date:** 2025-01-19  
**Expected Duration:** 2-5 minutes

