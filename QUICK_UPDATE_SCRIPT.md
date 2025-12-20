# 🚀 Script Cập Nhật Nhanh Dark Mode

## Cách Sử Dụng Trong VSCode

### 1. Mở Find & Replace (Ctrl+H / Cmd+H)
### 2. Enable Regex Mode (Alt+R / Cmd+Alt+R)
### 3. Chạy từng lệnh dưới đây theo thứ tự

---

## ⚡ Các Lệnh Thay Thế

### Background Classes

#### 1. bg-gray-50 → dark:bg-gray-900
```regex
Find: (className="[^"]*)(bg-gray-50)([^"]*)
Replace: $1$2 dark:bg-gray-900$3
```

#### 2. bg-white → dark:bg-gray-800
```regex
Find: (className="[^"]*)(bg-white)([^"]*)
Replace: $1$2 dark:bg-gray-800$3
```

#### 3. bg-gray-100 → dark:bg-gray-800
```regex
Find: (className="[^"]*)(bg-gray-100)([^"]*)
Replace: $1$2 dark:bg-gray-800$3
```

---

### Text Classes

#### 4. text-gray-900 → dark:text-white
```regex
Find: (className="[^"]*)(text-gray-900)([^"]*)
Replace: $1$2 dark:text-white$3
```

#### 5. text-gray-800 → dark:text-gray-100
```regex
Find: (className="[^"]*)(text-gray-800)([^"]*)
Replace: $1$2 dark:text-gray-100$3
```

#### 6. text-gray-700 → dark:text-gray-200
```regex
Find: (className="[^"]*)(text-gray-700)([^"]*)
Replace: $1$2 dark:text-gray-200$3
```

#### 7. text-gray-600 → dark:text-gray-300
```regex
Find: (className="[^"]*)(text-gray-600)([^"]*)
Replace: $1$2 dark:text-gray-300$3
```

#### 8. text-gray-500 → dark:text-gray-400
```regex
Find: (className="[^"]*)(text-gray-500)([^"]*)
Replace: $1$2 dark:text-gray-400$3
```

---

### Border Classes

#### 9. border-gray-300 → dark:border-gray-600
```regex
Find: (className="[^"]*)(border-gray-300)([^"]*)
Replace: $1$2 dark:border-gray-600$3
```

#### 10. border-gray-200 → dark:border-gray-700
```regex
Find: (className="[^"]*)(border-gray-200)([^"]*)
Replace: $1$2 dark:border-gray-700$3
```

---

### Hover States

#### 11. hover:bg-gray-100 → dark:hover:bg-gray-700
```regex
Find: (className="[^"]*)(hover:bg-gray-100)([^"]*)
Replace: $1$2 dark:hover:bg-gray-700$3
```

#### 12. hover:bg-gray-50 → dark:hover:bg-gray-800
```regex
Find: (className="[^"]*)(hover:bg-gray-50)([^"]*)
Replace: $1$2 dark:hover:bg-gray-800$3
```

---

## 📝 Checklist Sau Khi Chạy Script

- [ ] Review tất cả các thay đổi (Git diff)
- [ ] Test trang ở light mode
- [ ] Test trang ở dark mode
- [ ] Kiểm tra hover states
- [ ] Kiểm tra focus states
- [ ] Test responsive trên mobile
- [ ] Commit changes

---

## ⚠️ Lưu Ý Quan Trọng

1. **Backup trước khi chạy script**
2. **Chạy từng file một** - Không áp dụng cho toàn bộ project cùng lúc
3. **Review mỗi thay đổi** - Script có thể thay đổi nhầm một số trường hợp đặc biệt
4. **Test sau mỗi file** - Đảm bảo không có lỗi trước khi tiếp tục

---

## 🎯 Thứ Tự Ưu Tiên Update

1. **Shared Components** (Header, Toast, Modal, etc.)
2. **Main Pages** (PlantAnalysis, Knowledge, Community)
3. **User Pages** (Profile, MyPlants)
4. **Admin Pages**
5. **Other Pages**

---

## 💡 Tips

- Sử dụng "Match Case" và "Match Whole Word" nếu cần
- Có thể scope search vào một folder cụ thể
- Sử dụng Git để track changes dễ dàng revert nếu cần

