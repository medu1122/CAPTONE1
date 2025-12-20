# 🌙 Hướng Dẫn Áp Dụng Dark Mode Cho Toàn Bộ Hệ Thống

## ✅ Đã Hoàn Thành

### 1. **Theme System Setup**
- ✅ Tạo `ThemeContext` để quản lý theme globally (`src/contexts/ThemeContext.tsx`)
- ✅ Tích hợp `ThemeProvider` vào `App.tsx`
- ✅ Theme được lưu trong `localStorage` với key `userTheme`
- ✅ Theme tự động load khi khởi động app

### 2. **Trang Đã Hỗ Trợ Dark Mode**
- ✅ **AuthPage** (Login/Register/Forgot Password)
- ✅ **EmailVerificationPage**
- ✅ **ResetPasswordPage**
- ✅ **SettingsPage** (với AppearanceSection)
- ✅ **HomePage** (background)

---

## 🔧 Cách Sử Dụng ThemeContext

### Import và sử dụng hook:
```typescript
import { useTheme } from '../../contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme()
  
  return (
    <div className={`bg-white dark:bg-gray-900`}>
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  )
}
```

---

## 📝 Hướng Dẫn Áp Dụng Cho Từng Trang

### Bước 1: Thêm Dark Classes Cho Background
```typescript
// Từ:
<div className="min-h-screen bg-gray-50">

// Thành:
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
```

### Bước 2: Cập Nhật Text Colors
```typescript
// Text chính
className="text-gray-900 dark:text-white"

// Text phụ
className="text-gray-600 dark:text-gray-300"

// Text muted
className="text-gray-500 dark:text-gray-400"
```

### Bước 3: Cập Nhật Card/Container
```typescript
// Card/Container
className="bg-white dark:bg-gray-800"

// Với border
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
```

### Bước 4: Cập Nhật Input Fields
```typescript
className="bg-white dark:bg-gray-700 
           border-gray-300 dark:border-gray-600 
           text-gray-900 dark:text-white 
           placeholder-gray-500 dark:placeholder-gray-400"
```

### Bước 5: Cập Nhật Buttons
```typescript
// Primary Button (thường không cần thay đổi vì đã có màu riêng)
className="bg-green-600 text-white hover:bg-green-700"

// Secondary Button
className="bg-gray-200 dark:bg-gray-700 
           text-gray-900 dark:text-white 
           hover:bg-gray-300 dark:hover:bg-gray-600"
```

---

## 🎨 Color Mapping Chuẩn

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Background chính** | `bg-gray-50` | `bg-gray-900` |
| **Background phụ** | `bg-white` | `bg-gray-800` |
| **Card/Container** | `bg-white` | `bg-gray-800` |
| **Border** | `border-gray-200` | `border-gray-700` |
| **Text heading** | `text-gray-900` | `text-white` |
| **Text body** | `text-gray-600` | `text-gray-300` |
| **Text muted** | `text-gray-500` | `text-gray-400` |
| **Input background** | `bg-white` | `bg-gray-700` |
| **Input border** | `border-gray-300` | `border-gray-600` |
| **Input text** | `text-gray-900` | `text-white` |
| **Placeholder** | `placeholder-gray-500` | `placeholder-gray-400` |
| **Hover state** | `hover:bg-gray-100` | `hover:bg-gray-700` |

---

## 📋 Danh Sách Trang Cần Cập Nhật

### Trang Chính (Priority 1)
- [ ] **PlantAnalysisPage** - Trang phân tích cây
- [ ] **KnowledgePage** - Trang chatbot kiến thức
- [ ] **CommunityPage** - Trang cộng đồng
- [ ] **ProfilePage** - Trang profile người dùng
- [ ] **PublicProfilePage** - Trang profile công khai
- [ ] **MyPlantsPage** - Trang quản lý cây của tôi
- [ ] **PlantDetailPage** - Trang chi tiết cây

### Trang Phụ (Priority 2)
- [ ] **VietnamMapPage** - Bản đồ Việt Nam
- [ ] **ChangePasswordPage** - Đổi mật khẩu
- [ ] **AdminDashboardPage** - Trang admin

### Components Cần Cập Nhật (Priority 3)
- [ ] **Header** components
- [ ] **Toast** notifications
- [ ] **Modal** components
- [ ] **Card** components
- [ ] **Form** components

---

## 🚀 Script Nhanh - Tìm và Thay Thế

Sử dụng Find & Replace trong VSCode với Regex:

### 1. Background chính
```
Find: className="([^"]*?)bg-gray-50([^"]*?)"
Replace: className="$1bg-gray-50 dark:bg-gray-900$2"
```

### 2. Background trắng
```
Find: className="([^"]*?)bg-white([^"]*?)"
Replace: className="$1bg-white dark:bg-gray-800$2"
```

### 3. Text đen
```
Find: className="([^"]*?)text-gray-900([^"]*?)"
Replace: className="$1text-gray-900 dark:text-white$2"
```

### 4. Text xám
```
Find: className="([^"]*?)text-gray-600([^"]*?)"
Replace: className="$1text-gray-600 dark:text-gray-300$2"
```

**⚠️ Chú ý:** 
- Luôn kiểm tra sau khi thay thế tự động
- Một số element có thể cần dark class khác tùy theo context
- Test trên cả light và dark mode sau khi thay đổi

---

## 💡 Tips & Best Practices

### 1. Test Ngay Lập Tức
Sau khi cập nhật mỗi trang, test ngay:
- Chuyển đổi giữa light/dark mode
- Kiểm tra tất cả states (hover, focus, active)
- Test trên nhiều màn hình khác nhau

### 2. Consistency
- Sử dụng cùng một bộ màu cho cùng loại element
- Follow color mapping table ở trên
- Giữ contrast ratio tốt cho readability

### 3. Gradual Rollout
- Cập nhật từng trang một
- Commit sau mỗi trang hoàn thành
- Test kỹ trước khi chuyển sang trang tiếp theo

### 4. Components Dùng Chung
- Ưu tiên cập nhật shared components trước
- Tạo utility classes nếu cần
- Document các pattern thường dùng

---

## 📞 Support

Nếu gặp vấn đề:
1. Check `ThemeContext` đã được import đúng
2. Verify `ThemeProvider` wrap đúng level
3. Check console cho errors
4. Verify localStorage có key `userTheme`

---

## ✨ Example: Cập Nhật Một Trang Hoàn Chỉnh

### Before:
```typescript
export const MyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Title
        </h1>
        <p className="text-gray-600">
          Description
        </p>
        <div className="bg-white rounded-lg shadow p-6">
          <input 
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Enter text"
          />
        </div>
      </div>
    </div>
  )
}
```

### After:
```typescript
export const MyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Title
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Description
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <input 
            className="border border-gray-300 dark:border-gray-600 
                       rounded px-3 py-2 
                       bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white 
                       placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter text"
          />
        </div>
      </div>
    </div>
  )
}
```

---

**🎯 Mục tiêu:** Tất cả các trang và components đều hỗ trợ dark mode một cách nhất quán và mượt mà!

