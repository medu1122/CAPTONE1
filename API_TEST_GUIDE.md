# API Test Guide - Force Refresh Care Strategy

## ✅ Nút "Cập nhật" đã bị ẩn trên giao diện

Nút refresh strategy trong trang chi tiết cây trồng đã được ẩn đi (thêm class `hidden`).

---

## 🔧 Cách Test API Force Refresh

### **API Endpoint:**
```
POST http://localhost:4000/api/v1/plant-boxes/admin/force-refresh-all
```

**Yêu cầu:** Cần token admin

---

## 📋 Option 1: Sử dụng cURL (Terminal)

### Bước 1: Lấy Access Token
```bash
# Login để lấy token
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_admin_password"
  }'
```

Copy `accessToken` từ response.

### Bước 2: Gọi API Force Refresh
```bash
curl -X POST http://localhost:4000/api/v1/plant-boxes/admin/force-refresh-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Response mẫu:**
```json
{
  "success": true,
  "message": "Force refresh completed",
  "data": {
    "refreshed": 3,
    "skipped": 0,
    "errors": 0,
    "total": 3
  }
}
```

---

## 📋 Option 2: Sử dụng Browser Console (Dễ hơn)

### Bước 1: Đăng nhập vào hệ thống với tài khoản admin

Truy cập: `http://172.23.237.178:5173/auth` và đăng nhập.

### Bước 2: Mở Console (F12 → Console)

### Bước 3: Copy & Paste code này:

```javascript
// Get access token from localStorage
const token = localStorage.getItem('accessToken');

if (!token) {
  console.error('❌ No access token found. Please login first.');
} else {
  console.log('🔑 Token found:', token.substring(0, 20) + '...');
  
  // Call force refresh API
  fetch('http://localhost:4000/api/v1/plant-boxes/admin/force-refresh-all', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Force refresh response:', data);
    if (data.success) {
      console.log(`✨ Refreshed ${data.data.refreshed} plant boxes!`);
      console.log(`   - Total: ${data.data.total}`);
      console.log(`   - Skipped: ${data.data.skipped}`);
      console.log(`   - Errors: ${data.data.errors}`);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
}
```

### Bước 4: Xem kết quả trong console

---

## 📋 Option 3: Sử dụng Postman/Thunder Client

### Request Settings:
- **Method:** POST
- **URL:** `http://localhost:4000/api/v1/plant-boxes/admin/force-refresh-all`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
  ```
- **Body:** (empty - không cần body)

---

## 🤖 Option 4: Script Node.js (Tự động)

Tạo file `test-force-refresh.js`:

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api/v1';

async function forceRefreshAll() {
  try {
    // 1. Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Thay bằng email admin của bạn
      password: 'your_admin_password' // Thay bằng password admin
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');

    // 2. Force refresh
    console.log('🔄 Force refreshing all plant boxes...');
    const refreshResponse = await axios.post(
      `${API_BASE_URL}/plant-boxes/admin/force-refresh-all`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Force refresh completed:');
    console.log(JSON.stringify(refreshResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

forceRefreshAll();
```

**Chạy:**
```bash
node test-force-refresh.js
```

---

## 📊 Logs Để Kiểm Tra

### Backend Logs:
Khi gọi API, check backend logs (file `/tmp/backend_new_features.log` hoặc terminal):

```bash
tail -f /tmp/backend_new_features.log
```

Bạn sẽ thấy:
```
🔄 [Auto Refresh] Checking for expired care strategies...
🔄 [Auto Refresh] Found 3 plant boxes with expired strategies
✅ [Auto Refresh] Refreshed strategy for Cây cà chua của tôi
✅ [Auto Refresh] Refreshed strategy for Vườn rau sạch
🔄 [Auto Refresh] Completed: {"refreshed":2,"skipped":1,"errors":0,"total":3}
```

---

## 🔑 Lấy Admin Token Nhanh

Nếu bạn cần admin token:

### Option A: Từ Browser Console (đã login)
```javascript
console.log(localStorage.getItem('accessToken'));
```

### Option B: Tạo admin account mới
```bash
# Trong backend terminal
cd /Users/macos/Documents/Captone1/CAPTONE1/apps/backend
node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/modules/auth/auth.model.js').default;
  
  const adminEmail = 'admin@greengrow.com';
  const adminPassword = 'Admin123!';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);
  
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: 'Admin',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'active',
      isVerified: true
    },
    { upsert: true, new: true }
  );
  
  console.log('✅ Admin created:');
  console.log('   Email:', adminEmail);
  console.log('   Password:', adminPassword);
  process.exit(0);
});
"
```

---

## 🎯 Recommendation: Sử dụng Browser Console

**Đơn giản nhất:** Dùng Option 2 (Browser Console) vì:
1. Không cần setup gì thêm
2. Token tự động từ localStorage
3. Kết quả hiển thị ngay trong console
4. Có thể F5 lại trang để xem kết quả

**Bước nhanh:**
1. Login vào web với admin account
2. F12 → Console
3. Paste code từ Option 2
4. Enter
5. Xem kết quả! ✅

---

## 📝 Notes:

- API này **chỉ dành cho admin** (role='admin')
- API sẽ refresh **tất cả** PlantBox có strategy > 7 ngày
- Quá trình có thể mất 30s-2 phút tùy số lượng cây
- Có thể gọi bao nhiêu lần cũng được, không giới hạn
- Backend sẽ tự động skip những cây không cần refresh

---

## 🚀 Test Ngay:

```javascript
// Copy & paste vào Browser Console (F12)
fetch('http://localhost:4000/api/v1/plant-boxes/admin/force-refresh-all', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
}).then(r => r.json()).then(d => console.log('✅ Result:', d));
```

Happy testing! 🌱

