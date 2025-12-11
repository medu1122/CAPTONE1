# Plant Boxes Module

Module quản lý các "Plant Box" - hệ thống quản lý cây trồng thông minh với AI care strategy và mini chat bot.

## 📋 Tổng quan

Plant Box là hệ thống quản lý cây trồng thông minh, cho phép user:
- ✅ Tạo các box quản lý cây trồng (đang trồng hoặc dự định trồng)
- ✅ Tự động generate care strategy dựa trên thời tiết 7 ngày + thông tin cây + bệnh tật
- ✅ Quản lý bệnh tật với phản hồi người dùng (tệ hơn/đỡ hơn/đã khỏi)
- ✅ Tích hợp thông tin điều trị từ database (thuốc hóa học, phương pháp sinh học, biện pháp canh tác)
- ✅ Chat với bot về cây trồng (context-aware)
- ✅ Thêm notes, images, theo dõi tiến trình
- ✅ Thông tin mùa ra trái dựa trên loại cây + vị trí

## 🔄 Flow Công Việc Chính

### 1. Tạo Plant Box

```
User tạo Plant Box
    ↓
Nhập thông tin: tên cây, vị trí, loại đất, ánh sáng, giai đoạn,...
    ↓
Nếu có bệnh: Nhập tên bệnh, triệu chứng, mức độ
    ↓
Backend lưu vào DB
    ↓
Nếu plantType === 'existing' và có coordinates:
    → Tự động generate care strategy
```

### 2. Generate Care Strategy

```
User refresh strategy hoặc tạo box mới
    ↓
Backend fetch:
    - Weather data (7 ngày) từ OpenWeather API
    - Treatment recommendations từ database (nếu có bệnh)
    - Fruiting season info (nếu là cây ăn trái)
    ↓
Build GPT prompt với:
    - Thông tin cây (tên, giai đoạn, sức khỏe, vị trí)
    - Weather forecast 7 ngày
    - Treatment info từ DB (thuốc, liều lượng, cách dùng)
    - User feedback về bệnh (nếu có)
    - Fruiting season info
    ↓
Call GPT-3.5-turbo để generate strategy
    ↓
Parse JSON response
    ↓
Validate: Kiểm tra có hành động điều trị bệnh không (nếu có bệnh)
    ↓
Nếu không có → Tự động thêm vào 2-3 ngày đầu
    ↓
Lưu vào DB (careStrategy field)
    ↓
Return strategy cho frontend
```

### 3. Quản lý Bệnh Tật

```
User nhập bệnh khi tạo/update box
    ↓
Backend search treatment recommendations từ database:
    - Fuzzy matching tên bệnh (không dấu, không chính tả)
    - Tìm thuốc hóa học, phương pháp sinh học, biện pháp canh tác
    ↓
Lưu bệnh vào currentDiseases array
    ↓
Khi generate strategy:
    - Ưu tiên điều trị bệnh
    - Sử dụng thông tin từ DB (tên thuốc, liều lượng cụ thể)
    - Điều chỉnh theo phản hồi người dùng
```

### 4. Phản Hồi Bệnh Tật

```
User cập nhật tình trạng bệnh (tệ hơn/đỡ hơn/đã khỏi)
    ↓
Backend lưu feedback vào disease.feedback array
    ↓
Cập nhật disease.status dựa trên feedback:
    - 'resolved' → status = 'resolved'
    - 'better' → status = 'treating'
    - 'worse' → status = 'active'
    ↓
Khi refresh strategy:
    - Đọc latest feedback
    - Điều chỉnh số lượng và tần suất hành động điều trị:
      * "TỆ HƠN" → 3-4 hành động trong 4 ngày đầu
      * "KHÔNG ĐỔI" → 2-3 hành động trong 3 ngày đầu
      * "ĐỠ HƠN" → 1-2 hành động trong 2 ngày đầu
      * "ĐÃ KHỎI" → Chỉ phòng ngừa, không điều trị tích cực
```

### 5. Mini Chat Bot

```
User gửi message về cây trồng
    ↓
Backend load context:
    - Plant box data (tên, giai đoạn, sức khỏe, bệnh tật)
    - Weather data (7 ngày)
    - Care strategy (actions, reasons)
    - Treatment info (nếu có bệnh)
    ↓
Build system prompt với tất cả context
    ↓
Call GPT với system prompt + user message
    ↓
Return response (tối đa 150 từ, cụ thể và ngắn gọn)
```

## 🎯 Chức Năng Chính

### 1. CRUD Plant Boxes
- **Create**: Tạo box mới với validation đầy đủ
- **Read**: Lấy danh sách box (có filter, pagination) hoặc box theo ID
- **Update**: Cập nhật thông tin box (tự động regenerate strategy nếu cần)
- **Delete**: Soft delete (set `isActive: false`)

### 2. AI Care Strategy Generation
- **Auto-generate** khi:
  - Tạo box mới (nếu `plantType === 'existing'` và có coordinates)
  - Update location/plant info
  - User manually refresh
- **Input**:
  - Plant info (tên, giai đoạn, sức khỏe, vị trí, đất, ánh sáng)
  - Weather forecast 7 ngày
  - Treatment recommendations (nếu có bệnh)
  - User feedback về bệnh (nếu có)
  - Fruiting season info
- **Output**: Strategy với actions cụ thể cho 7 ngày:
  - `water`: Tưới nước (dựa trên thời tiết)
  - `fertilize`: Bón phân (khi cần thiết)
  - `protect`: Điều trị bệnh (BẮT BUỘC nếu có bệnh)
  - `check`: Kiểm tra (khi có cảnh báo thời tiết)
  - `prune`: Cắt tỉa (khi cần)

### 3. Disease Management
- **Thêm bệnh**: User nhập tên bệnh, triệu chứng, mức độ
- **Search treatment**: Fuzzy matching tên bệnh, tìm trong database
- **Treatment types**:
  - Thuốc hóa học (tên, hoạt chất, liều lượng, cách dùng, tần suất)
  - Phương pháp sinh học (vật liệu, các bước, thời gian)
  - Biện pháp canh tác (hành động, mô tả, ưu tiên)
- **Feedback**: User cập nhật tình trạng bệnh → ảnh hưởng đến strategy

### 4. Mini Chat Bot
- **Context-aware**: Hiểu plant info + weather + care strategy + treatment info
- **Stateless**: Mỗi request độc lập, không lưu history
- **Short responses**: Tối đa 150 từ, cụ thể và ngắn gọn

### 5. Notes & Images
- **Notes**: Thêm ghi chú về chăm sóc, quan sát, vấn đề, milestone
- **Images**: Upload ảnh với mô tả, theo dõi tiến trình

## 🗄️ Database Schema

### PlantBox Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  
  // Basic Info
  name: String,                    // Tên box (user tự đặt)
  plantType: 'existing' | 'planned',
  plantName: String,               // Tên cây
  scientificName: String,
  
  // Timing
  plantedDate: Date,               // Nếu existing
  plannedDate: Date,               // Nếu planned
  
  // Location
  location: {
    name: String,                   // "Vườn sau nhà"
    coordinates: { lat, lon },
    area: Number,                   // m²
    soilType: String | [String],    // Cho phép nhiều loại đất
    sunlight: 'full' | 'partial' | 'shade'
  },
  
  // Plant Details
  quantity: Number,
  growthStage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting',
  currentHealth: 'excellent' | 'good' | 'fair' | 'poor',
  
  // Diseases
  currentDiseases: [{
    name: String,                  // Tên bệnh
    symptoms: String,              // Triệu chứng
    severity: 'mild' | 'moderate' | 'severe',
    detectedDate: Date,
    treatmentPlan: String,
    status: 'active' | 'treating' | 'resolved',
    feedback: [{                   // User feedback
      date: Date,
      status: 'worse' | 'same' | 'better' | 'resolved',
      notes: String
    }]
  }],
  healthNotes: String,
  
  // Care Preferences
  careLevel: 'low' | 'medium' | 'high',
  wateringMethod: 'manual' | 'drip' | 'sprinkler',
  
  // AI Strategy (auto-generated)
  careStrategy: {
    lastUpdated: Date,
    next7Days: [{
      date: Date,
      actions: [{
        type: 'water' | 'fertilize' | 'prune' | 'check' | 'protect',
        time: String,              // "07:00" hoặc "Sáng sớm"
        description: String,        // Mô tả cụ thể hành động
        reason: String,             // Lý do dựa trên thời tiết/bệnh
        products: [String]          // Tên thuốc/sản phẩm cần dùng
      }],
      weather: {
        temp: { min, max },
        humidity: Number,
        rain: Number,
        alerts: [String]
      }
    }],
    summary: String                // Tóm tắt chiến lược (có thể chứa fruiting season info)
  },
  
  // Images & Notes
  images: [{
    url: String,
    date: Date,
    description: String
  }],
  notes: [{
    date: Date,
    content: String,
    type: 'care' | 'observation' | 'issue' | 'milestone'
  }],
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### 1. Get All Plant Boxes
```http
GET /api/v1/plant-boxes?plantType=existing&page=1&limit=20
```

### 2. Get Plant Box by ID
```http
GET /api/v1/plant-boxes/:id
```

### 3. Create Plant Box
```http
POST /api/v1/plant-boxes
```
**Body:** Xem schema ở trên

**Note:** Nếu `plantType === 'existing'` và có `location.coordinates`, hệ thống sẽ tự động generate care strategy.

### 4. Update Plant Box
```http
PUT /api/v1/plant-boxes/:id
```

**Note:** Nếu update `location`, `plantName`, hoặc `plantType`, hệ thống sẽ tự động regenerate care strategy.

### 5. Delete Plant Box
```http
DELETE /api/v1/plant-boxes/:id
```
Soft delete (set `isActive: false`).

### 6. Refresh Care Strategy
```http
POST /api/v1/plant-boxes/:id/refresh-strategy
```
Force regenerate care strategy với weather data mới nhất.

### 7. Add Disease Feedback
```http
POST /api/v1/plant-boxes/:id/disease-feedback
```
**Body:**
```json
{
  "diseaseIndex": 0,
  "status": "worse" | "same" | "better" | "resolved",
  "notes": "Ghi chú thêm (optional)"
}
```

### 8. Chat with Plant Box
```http
POST /api/v1/plant-boxes/:id/chat
```
**Body:**
```json
{
  "message": "Tại sao hôm nay tưới nhiều hơn?"
}
```

### 9. Add Note
```http
POST /api/v1/plant-boxes/:id/notes
```

### 10. Add Image
```http
POST /api/v1/plant-boxes/:id/images
```

## 🤖 AI Care Strategy - Chi Tiết

### Prompt Structure

1. **Plant Info**: Tên, giai đoạn, sức khỏe, vị trí, đất, ánh sáng
2. **Disease Info** (nếu có):
   - Tên bệnh, triệu chứng, mức độ
   - Treatment recommendations từ DB (thuốc, liều lượng, cách dùng)
   - User feedback (tệ hơn/đỡ hơn/đã khỏi)
3. **Fruiting Season Info** (nếu là cây ăn trái)
4. **Weather Forecast**: 7 ngày với nhiệt độ, độ ẩm, mưa, cảnh báo

### Strategy Generation Rules

**Nếu có bệnh:**
- ✅ **BẮT BUỘC** đưa hành động điều trị vào ít nhất 2-3 ngày đầu
- ✅ Sử dụng **TÊN THUỐC/PHƯƠNG PHÁP CỤ THỂ** từ database
- ✅ Bao gồm **liều lượng, cách dùng** từ database
- ✅ Điều chỉnh theo **phản hồi người dùng**:
  - "TỆ HƠN" → 3-4 hành động trong 4 ngày đầu
  - "KHÔNG ĐỔI" → 2-3 hành động trong 3 ngày đầu
  - "ĐỠ HƠN" → 1-2 hành động trong 2 ngày đầu
  - "ĐÃ KHỎI" → Chỉ phòng ngừa

**Nếu không có bệnh:**
- Chỉ đưa hành động khi **THỰC SỰ CẦN THIẾT**:
  - Tưới nước (dựa trên thời tiết)
  - Cảnh báo thời tiết
  - Kiểm tra (khi có dấu hiệu bất thường)
- **KHÔNG** đưa hành động định kỳ không có lý do (ví dụ: "Bón phân NPK" chung chung)

### Validation & Fallback

- **Validation**: Kiểm tra có hành động điều trị không (nếu có bệnh)
- **Auto-fix**: Nếu không có → Tự động thêm vào 2-3 ngày đầu
- **Fallback**: Nếu GPT fails → Tạo strategy cơ bản với treatment actions (nếu có bệnh)

## 💬 Mini Chat Bot

### Context Loading
1. Plant box data (tên, giai đoạn, sức khỏe, bệnh tật)
2. Weather data (7 ngày)
3. Care strategy (actions, reasons)
4. Treatment info (nếu có bệnh)

### Response Style
- Tối đa 150 từ
- Cụ thể và ngắn gọn
- Tham chiếu đến care strategy và treatment info

### Example Questions
- "Tại sao hôm nay tưới nhiều hơn?"
- "Có cần bón phân không?"
- "Cây có vẻ yếu, làm sao?"
- "Thuốc này có hiệu quả không?"
- "Ngày mai có cần che phủ không?"

## 🔐 Authentication

Tất cả endpoints đều yêu cầu authentication (`authMiddleware`).

## 📝 Notes

- Care strategy được cache trong DB, refresh khi cần
- Weather data được cache 1 giờ
- Chat bot không lưu history (stateless)
- Plant box soft delete (`isActive: false`)
- Treatment recommendations được search với fuzzy matching (không dấu, không chính tả)

## 🚀 Future Enhancements

- [ ] Email notifications với care schedule
- [ ] SMS notifications
- [ ] Compare strategies over time
- [ ] Export care report (PDF)
- [ ] Plant timeline view
- [ ] Photo gallery với comparison
- [ ] Natural language input cho form tạo box
- [ ] Auto-fill từ knowledge base khi chọn cây
