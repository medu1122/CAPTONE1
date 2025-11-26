# Cấu hình IP LAN: 172.16.0.135

## ✅ Đã cấu hình

File `.env` đã được tạo tại: `apps/frontend/.env`

Nội dung:
```env
VITE_API_URL=http://172.16.0.135:4000/api/v1
```

## 📋 Thông tin truy cập

### Frontend URL (từ máy khác):
```
http://172.16.0.135:5173
```

### Backend URL:
```
http://172.16.0.135:4000/api/v1
```

## 🔍 Kiểm tra

### 1. Kiểm tra Backend:
```bash
curl http://172.16.0.135:4000/api/v1/health
# Phải trả về: {"ok":true,"time":"..."}
```

### 2. Kiểm tra Frontend:
- Truy cập: `http://172.16.0.135:5173` từ máy khác
- Mở Console (F12)
- Kiểm tra log: `🌐 [API Config] Backend URL:`
- Phải thấy: `http://172.16.0.135:4000/api/v1`

## ⚠️ Lưu ý

1. **Backend phải đang chạy** và listen trên `0.0.0.0`:
   ```bash
   # Kiểm tra trong server.js
   HOST=0.0.0.0  # Đã được set mặc định
   ```

2. **Frontend phải được khởi động lại** sau khi tạo file .env:
   ```bash
   cd apps/frontend
   # Dừng frontend (Ctrl+C)
   npm run dev
   ```

3. **Firewall** có thể chặn kết nối:
   ```bash
   # macOS - Kiểm tra firewall
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   ```

4. **IP có thể thay đổi** nếu:
   - Router restart
   - DHCP renew
   - Kết nối mạng khác
   
   Giải pháp: Set IP tĩnh trong router hoặc cập nhật lại file .env

## 🔄 Cập nhật IP (nếu thay đổi)

```bash
cd CAPTONE1/apps/frontend
echo "VITE_API_URL=http://172.16.0.135:4000/api/v1" > .env
# Khởi động lại frontend
```

## ✅ Test từ máy khác

1. **Truy cập frontend:**
   - URL: `http://172.16.0.135:5173`
   - Phải load được giao diện

2. **Test đăng nhập:**
   - Đăng nhập thành công ✅

3. **Test upload ảnh:**
   - Upload ảnh và phân tích ✅
   - Không còn lỗi `ERR_CONNECTION_REFUSED` ✅

4. **Test các chức năng khác:**
   - Chat, Community, Profile, v.v. ✅

## 📝 File .env hiện tại

```
VITE_API_URL=http://172.16.0.135:4000/api/v1
```

**IP đang sử dụng:** `172.16.0.135`

