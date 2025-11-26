# Hướng dẫn khắc phục lỗi LAN Access

## Vấn đề: ERR_CONNECTION_REFUSED khi truy cập từ thiết bị khác

### Nguyên nhân
Khi truy cập frontend từ thiết bị khác trong cùng mạng LAN, frontend có thể đang cố kết nối đến `localhost:4000` (của thiết bị đó) thay vì IP của máy server.

### Giải pháp

#### 1. Kiểm tra Backend đang chạy
```bash
# Kiểm tra port 4000
lsof -ti:4000

# Nếu không có, khởi động backend
cd CAPTONE1/apps/backend
npm run dev
```

#### 2. Kiểm tra Frontend đang chạy với host 0.0.0.0
```bash
# Kiểm tra port 5173
lsof -ti:5173

# Nếu không có, khởi động frontend
cd CAPTONE1/apps/frontend
npm run dev
```

#### 3. Lấy IP LAN của máy server
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Hoặc
ipconfig getifaddr en0  # macOS
```

#### 4. Truy cập từ thiết bị khác
- **KHÔNG** truy cập: `http://localhost:5173`
- **NÊN** truy cập: `http://192.168.1.62:5173` (thay bằng IP LAN của bạn)

#### 5. Cấu hình môi trường (Tùy chọn)

Tạo file `.env` trong `apps/frontend/`:
```env
VITE_API_URL=http://192.168.1.62:4000/api/v1
```

Thay `192.168.1.62` bằng IP LAN của máy server.

### Kiểm tra nhanh

1. **Backend đang listen trên tất cả interfaces:**
   ```bash
   netstat -an | grep 4000 | grep LISTEN
   # Phải thấy: *.4000 hoặc 0.0.0.0.4000
   ```

2. **Frontend đang listen trên tất cả interfaces:**
   ```bash
   netstat -an | grep 5173 | grep LISTEN
   # Phải thấy: *.5173 hoặc 0.0.0.0.5173
   ```

3. **Test kết nối từ máy server:**
   ```bash
   curl http://localhost:4000/api/v1/health
   curl http://192.168.1.62:4000/api/v1/health
   ```

4. **Test từ thiết bị khác:**
   - Mở browser trên thiết bị khác
   - Truy cập: `http://192.168.1.62:5173`
   - Mở DevTools Console
   - Kiểm tra log: `🌐 [API Config] Backend URL:`
   - Phải thấy: `http://192.168.1.62:4000/api/v1` (KHÔNG phải localhost)

### Cấu hình Firewall (nếu cần)

#### macOS
```bash
# Kiểm tra firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Nếu firewall đang bật, thêm exception cho Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

#### Linux (UFW)
```bash
sudo ufw allow 4000/tcp
sudo ufw allow 5173/tcp
```

### Debug

1. **Kiểm tra console log trên thiết bị khác:**
   - Mở DevTools (F12)
   - Xem tab Console
   - Tìm log: `🌐 [API Config] Backend URL:`
   - URL phải là IP LAN, không phải localhost

2. **Test API trực tiếp từ thiết bị khác:**
   ```bash
   # Từ thiết bị khác, chạy:
   curl http://192.168.1.62:4000/api/v1/health
   ```

3. **Kiểm tra CORS:**
   - Backend đã cấu hình CORS với `origin: true`
   - Cho phép tất cả origins

### Lưu ý

- **Luôn truy cập frontend bằng IP LAN** khi dùng từ thiết bị khác
- **Không dùng localhost** khi truy cập từ thiết bị khác
- **IP LAN có thể thay đổi** nếu router restart hoặc DHCP renew
- **Có thể set IP tĩnh** trong router để tránh thay đổi IP

### IP hiện tại của máy server
**192.168.1.62**

Cập nhật IP này trong `.env` nếu cần:
```env
VITE_API_URL=http://192.168.1.62:4000/api/v1
```

