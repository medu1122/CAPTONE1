# 🔧 Quick Fix: LAN Access Issue

## Vấn đề
Khi truy cập từ thiết bị khác, gặp lỗi `ERR_CONNECTION_REFUSED` vì frontend đang cố kết nối đến `localhost:4000`.

## Giải pháp nhanh (3 bước)

### Bước 1: Lấy IP LAN của máy server
```bash
cd CAPTONE1
./get-lan-ip.sh
```

Hoặc tự tìm:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

**IP hiện tại:** `192.168.1.62`

### Bước 2: Tạo file .env trong frontend
```bash
cd CAPTONE1/apps/frontend
echo "VITE_API_URL=http://192.168.1.62:4000/api/v1" > .env
```

**Lưu ý:** Thay `192.168.1.62` bằng IP LAN của bạn!

### Bước 3: Khởi động lại frontend
```bash
# Dừng frontend (Ctrl+C)
# Sau đó khởi động lại
npm run dev
```

## Kiểm tra

### Từ máy server:
1. Truy cập: `http://localhost:5173` ✅
2. Mở Console, kiểm tra: `🌐 [API Config] Backend URL: http://localhost:4000/api/v1` ✅

### Từ thiết bị khác:
1. Truy cập: `http://192.168.1.62:5173` ✅ (thay bằng IP của bạn)
2. Mở Console, kiểm tra: `🌐 [API Config] Backend URL: http://192.168.1.62:4000/api/v1` ✅

## Test Backend từ thiết bị khác
```bash
# Từ thiết bị khác, chạy:
curl http://192.168.1.62:4000/api/v1/health

# Phải trả về: {"ok":true,"time":"..."}
```

## Nếu vẫn không được

### 1. Kiểm tra Backend đang chạy
```bash
lsof -ti:4000
# Phải có process ID
```

### 2. Kiểm tra Backend listen trên tất cả interfaces
```bash
netstat -an | grep 4000 | grep LISTEN
# Phải thấy: *.4000 hoặc 0.0.0.0.4000
```

### 3. Kiểm tra Frontend listen trên tất cả interfaces
```bash
netstat -an | grep 5173 | grep LISTEN
# Phải thấy: *.5173 hoặc 0.0.0.0.5173
```

### 4. Kiểm tra Firewall
```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Nếu firewall đang bật, thêm exception
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/bin/node
```

### 5. Kiểm tra Router/Network
- Đảm bảo cả 2 thiết bị cùng mạng LAN
- Thử ping: `ping 192.168.1.62` (từ thiết bị khác)

## Tự động detect (Không cần .env)

Nếu không muốn tạo file .env, frontend sẽ tự động detect:
- Truy cập bằng `localhost` → dùng `localhost:4000`
- Truy cập bằng IP LAN → dùng IP LAN:4000

**Nhưng phải đảm bảo:**
- ✅ Truy cập frontend bằng IP LAN, không phải localhost
- ✅ Backend đang chạy và listen trên 0.0.0.0
- ✅ Frontend đang chạy và listen trên 0.0.0.0

## Tóm tắt

**Cách đơn giản nhất:**
1. Tạo file `.env` với IP LAN của bạn
2. Khởi động lại frontend
3. Truy cập từ thiết bị khác bằng IP LAN

**IP hiện tại:** `192.168.1.62`

