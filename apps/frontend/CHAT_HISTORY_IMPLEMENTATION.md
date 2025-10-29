# 📋 FRONTEND: Chat History Implementation Required

## 🎯 Mục tiêu

Hiện tại **backend đã hoàn thiện** việc lưu và load lịch sử chat từ MongoDB. Frontend cần implement để:
- ✅ Load lịch sử chat từ database khi page load
- ✅ Restore messages khi switch session
- ✅ Persist chat history sau khi logout/login hoặc backend restart

---

## 🔧 Backend API đã sẵn sàng

### **GET `/api/v1/chat/history`**

**Query Parameters:**
```typescript
{
  sessionId: string;      // Required - UUID của session
  limit?: number;         // Optional - Default 20
  page?: number;          // Optional - Default 1
}
```

**Headers:**
```typescript
{
  Authorization: 'Bearer YOUR_JWT_TOKEN'  // Optional - guest users không cần
}
```

**Response:**
```typescript
{
  messages: [
    {
      _id: string;
      sessionId: string;
      role: 'user' | 'assistant';
      message: string;
      messageType: 'text' | 'image' | 'image-text';
      analysis: {  // Nếu có plant analysis
        _id: string;
        resultTop: {
          plant: {
            commonName: string;
            scientificName: string;
          },
          confidence: number;
        }
      } | null;
      createdAt: string;  // ISO timestamp
    }
  ],
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}
```

---

## ✨ Yêu cầu implement

### **1. Tạo service để load history**

**File:** `src/services/chatHistoryService.ts`

```typescript
import api from '@/config/api';

interface LoadHistoryParams {
  sessionId: string;
  limit?: number;
  page?: number;
}

interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  message: string;
  messageType: 'text' | 'image' | 'image-text';
  analysis?: {
    _id: string;
    resultTop: {
      plant: {
        commonName: string;
        scientificName: string;
      };
      confidence: number;
    };
  } | null;
  createdAt: string;
}

interface LoadHistoryResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const loadChatHistory = async ({
  sessionId,
  limit = 20,
  page = 1,
}: LoadHistoryParams): Promise<LoadHistoryResponse> => {
  try {
    const response = await api.get('/chat/history', {
      params: { sessionId, limit, page },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    throw error;
  }
};
```

---

### **2. Update ChatAnalyzePage để load history**

**File:** `src/pages/ChatAnalyzePage/ChatAnalyzePage.tsx`

```typescript
import { loadChatHistory } from '@/services/chatHistoryService';

// ... existing code ...

useEffect(() => {
  // Load history when component mounts
  const sessionId = localStorage.getItem('currentSessionId');
  if (sessionId) {
    loadHistoryFromDB(sessionId);
  }
}, []);

const loadHistoryFromDB = async (sessionId: string) => {
  try {
    setIsLoadingHistory(true);
    
    const { messages } = await loadChatHistory({ 
      sessionId, 
      limit: 50  // Load last 50 messages
    });
    
    // Convert backend format to frontend format
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      role: msg.role,
      content: msg.message,
      type: msg.messageType,
      timestamp: new Date(msg.createdAt),
      analysis: msg.analysis ? {
        plantName: msg.analysis.resultTop.plant.commonName,
        scientificName: msg.analysis.resultTop.plant.scientificName,
        confidence: msg.analysis.resultTop.confidence,
      } : undefined,
    }));
    
    setMessages(formattedMessages);
    
  } catch (error) {
    console.error('Failed to load chat history:', error);
    // Không hiển thị error cho user, vì có thể là session mới
  } finally {
    setIsLoadingHistory(false);
  }
};
```

---

### **3. Update Context để load history khi switch session**

**File:** `src/contexts/ChatAnalyzeContext.tsx`

```typescript
const switchSession = async (sessionId: string) => {
  try {
    // Save current session to localStorage
    localStorage.setItem('currentSessionId', sessionId);
    
    // Clear current messages
    setMessages([]);
    
    // Load new session history
    const { messages } = await loadChatHistory({ sessionId, limit: 50 });
    
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      role: msg.role,
      content: msg.message,
      type: msg.messageType,
      timestamp: new Date(msg.createdAt),
      analysis: msg.analysis ? {
        plantName: msg.analysis.resultTop.plant.commonName,
        scientificName: msg.analysis.resultTop.plant.scientificName,
        confidence: msg.analysis.resultTop.confidence,
      } : undefined,
    }));
    
    setMessages(formattedMessages);
    
  } catch (error) {
    console.error('Failed to switch session:', error);
  }
};
```

---

### **4. Update ChatMessages để display analysis info**

**File:** `src/pages/ChatAnalyzePage/components/chat/ChatMessages.tsx`

```typescript
{message.analysis && (
  <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-green-700">
        🌱 {message.analysis.plantName}
      </span>
      <span className="text-xs text-gray-500">
        ({message.analysis.scientificName})
      </span>
    </div>
    <div className="text-xs text-gray-600 mt-1">
      Confidence: {(message.analysis.confidence * 100).toFixed(1)}%
    </div>
  </div>
)}
```

---

## 🧪 Testing Checklist

### **Test 1: Load history on page mount**
```
1. Gửi vài messages trong chat
2. Refresh page (F5)
3. ✅ Messages hiển thị lại từ database
```

### **Test 2: Load history sau khi logout/login**
```
1. Gửi messages
2. Logout
3. Login lại
4. ✅ Messages vẫn còn
```

### **Test 3: Load history sau khi backend restart**
```
1. Gửi messages
2. Restart backend
3. Refresh frontend
4. ✅ Messages vẫn load được từ DB
```

### **Test 4: Switch sessions**
```
1. Chat trong session A
2. Switch sang session B
3. Chat trong session B
4. Switch lại session A
5. ✅ Messages của session A hiển thị đúng
```

### **Test 5: Plant analysis display**
```
1. Upload ảnh cây (vd: cà chua)
2. Refresh page
3. ✅ Plant info hiển thị trong message
4. ✅ Plant name + scientific name + confidence
```

---

## 📊 Flow hoạt động

### **User gửi message:**
```
Frontend
  ├─ Send message qua SSE endpoint
  └─ Backend saves to MongoDB (auto)

Backend
  ├─ Process message (GPT/Plant.id)
  ├─ Save user message to DB
  ├─ Save assistant response to DB
  └─ Stream response to frontend
```

### **User refresh page:**
```
Frontend
  ├─ Get sessionId from localStorage
  ├─ Call loadChatHistory(sessionId)
  └─ Display messages from DB

Backend
  ├─ Load messages from MongoDB
  ├─ Populate analysis data
  └─ Return formatted response
```

### **User switch session:**
```
Frontend
  ├─ Clear current messages
  ├─ Update localStorage
  ├─ Call loadChatHistory(newSessionId)
  └─ Display new session messages
```

---

## 🎯 Kết quả mong đợi

✅ **Chat history persistent** - Messages không mất khi refresh/logout/restart

✅ **Session-based** - Mỗi session có history riêng

✅ **Plant context** - Bot nhớ plant từ ảnh trước đó

✅ **Guest users** - Hoạt động cả khi chưa login

✅ **Performance** - Pagination support, chỉ load 50 messages gần nhất

---

## ⚠️ Lưu ý quan trọng

1. **sessionId PHẢI được pass** trong mọi request chat
2. **localStorage.currentSessionId** phải được maintain
3. **Guest users** không cần JWT token, backend vẫn save messages
4. **Analysis data** chỉ có khi message có hình ảnh plant
5. **Pagination** nên implement nếu user có nhiều messages (>50)

---

## 📞 Backend Contact Points

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/chat/analyze` | POST | Gửi message (text/image) - SSE streaming |
| `/api/v1/chat/history` | GET | Load history cho session |
| `/api/v1/chat-sessions` | GET | List sessions của user |
| `/api/v1/chat-sessions` | POST | Tạo session mới |

---

## 🚀 Priority Tasks

1. **HIGH**: Implement `loadChatHistory` service
2. **HIGH**: Load history on page mount
3. **MEDIUM**: Load history on session switch
4. **MEDIUM**: Display plant analysis info
5. **LOW**: Implement pagination for long histories

---

## ✅ Backend Status

| Feature | Status | Notes |
|---------|--------|-------|
| Save messages | ✅ DONE | Auto save mọi message |
| Load history API | ✅ DONE | `/api/v1/chat/history` |
| Context-aware AI | ✅ DONE | Bot nhớ conversation |
| Multi-plant handling | ✅ DONE | Smart filtering |
| Guest user support | ✅ DONE | userId = null |
| Analysis linking | ✅ DONE | messages ↔ analyses |

**Backend đã 100% ready. Frontend chỉ cần gọi API và display!** 🎉

---

## 📄 Related Documentation

- Backend implementation: `CAPTONE1/apps/backend/CHAT_HISTORY_SOLUTION.md`
- API documentation: `CAPTONE1/apps/backend/README.md`
- Database schema: `CAPTONE1/apps/backend/data_info.md`

---

**Có câu hỏi? Check backend logs hoặc MongoDB để debug!** 🔍

---

## 🔐 Security Enhancement: Session Persistence After F5

### ❌ Problem
After F5 refresh, users were logged out because `accessToken` was stored in memory (`window` object).

**Flow:**
```
Login → accessToken saved to window.accessToken (memory)
  ↓
F5 Refresh → window.accessToken = null (memory cleared)
  ↓
isAuthenticated() = false → Redirect to /auth ❌
```

### ✅ Solution Implemented
**Auto-refresh on page load using refreshToken:**

**New Flow:**
```
Page Load/F5
  ↓
Check accessToken in memory?
  ├─ YES → Try to load profile
  │   ├─ Success → User logged in ✅
  │   └─ Fail (401) → Try refresh below
  │
  └─ NO → Check refreshToken in localStorage?
      ├─ YES → Call POST /auth/refresh
      │   ├─ Success → Get new accessToken → Load profile ✅
      │   └─ Fail → Clear tokens → Stay logged out
      │
      └─ NO → User not authenticated
```

### 📊 Implementation Details

**1. Token Storage Strategy:**
```typescript
accessToken  → window object (memory)
  - More secure (not in localStorage)
  - Cleared on F5
  - Short-lived (15 minutes)

refreshToken → localStorage
  - Persists across F5
  - Used to get new accessToken
  - Long-lived (7 days)
```

**2. Files Modified:**

**`src/services/authService.ts`**
```typescript
// Line 213: Export refresh function
export const refreshAccessToken = authService.refreshAccessToken
```

**`src/contexts/AuthContext.tsx`**
```typescript
// Line 47-96: Auto-refresh logic
useEffect(() => {
  const checkAuth = async () => {
    // Try accessToken first
    if (authService.isAuthenticated()) {
      try {
        const response = await authService.getProfile()
        setUser(response.data)
        return
      } catch (error) {
        console.log('AccessToken invalid, trying refresh...')
      }
    }
    
    // Fallback to refreshToken
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        const refreshResponse = await authService.refreshAccessToken(refreshToken)
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data
        
        // Save new tokens
        (window as any).accessToken = accessToken
        localStorage.setItem('refreshToken', newRefreshToken)
        
        // Load profile
        const profileResponse = await authService.getProfile()
        setUser(profileResponse.data)
        
        console.log('✅ Session restored successfully')
      } catch (error) {
        console.error('❌ Failed to restore session:', error)
      }
    }
    
    setIsLoading(false)
  }

  checkAuth()
}, [])
```

### 🎯 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **F5 Behavior** | ❌ Logout | ✅ Stay logged in |
| **Security** | ⚠️ accessToken in memory | ✅ Same (memory) |
| **UX** | ❌ Poor | ✅ Excellent |
| **Token Refresh** | Manual | ✅ Automatic |
| **Cross-tab** | Not supported | Still not supported* |

\* *Cross-tab sync requires additional implementation (BroadcastChannel API)*

### 🧪 Testing Checklist

#### **Test 1: Normal F5 Refresh**
```
1. Login with email/password
2. Navigate to ChatAnalyzePage
3. Press F5
4. ✅ Expected: Stay logged in, no redirect
5. ✅ Console: "🔄 Restoring session from refreshToken..."
6. ✅ Console: "✅ Session restored successfully"
```

#### **Test 2: AccessToken Expired**
```
1. Login
2. Wait 15 minutes (accessToken expires)
3. Make API call (e.g., send chat message)
4. ✅ Expected: Auto-refresh via interceptor
5. ✅ Request succeeds with new token
```

#### **Test 3: RefreshToken Invalid/Expired**
```
1. Login
2. Manually delete refreshToken from localStorage
   - Open DevTools → Application → Local Storage → Delete "refreshToken"
3. Press F5
4. ✅ Expected: Redirect to /auth
5. ✅ Console: "📭 No refresh token found, user not authenticated"
```

#### **Test 4: Backend Restart**
```
1. Login
2. Restart backend server
3. Press F5 on frontend
4. ✅ Expected: 
   - If refreshToken valid → Session restored
   - If refreshToken in DB cleared → Redirect to /auth
```

### 🔍 Debugging

**Check tokens in console:**
```javascript
// AccessToken (should be null after F5)
console.log('AccessToken:', window.accessToken)

// RefreshToken (should persist)
console.log('RefreshToken:', localStorage.getItem('refreshToken'))
```

**Network tab:**
```
F5 → Look for:
1. POST /api/v1/auth/refresh  (should be called)
2. GET /api/v1/auth/profile   (should succeed after refresh)
```

**Console logs:**
```
🔄 Restoring session from refreshToken...
✅ Session restored successfully
```

### 📝 Related Files

- `src/contexts/AuthContext.tsx` - Auto-refresh logic
- `src/services/authService.ts` - Token management & refresh API
- `src/components/ProtectedRoute.tsx` - Route protection
- Backend: `CAPTONE1/apps/backend/src/modules/auth/auth.routes.js`

### ⚠️ Known Limitations

1. **Cross-tab sync:** Login in one tab doesn't sync to other tabs
   - **Solution:** Implement BroadcastChannel API or localStorage events
   
2. **Silent refresh:** No UI feedback during auto-refresh
   - **Current:** Shows loading spinner via `isLoading` state
   
3. **Offline behavior:** Refresh fails if no internet
   - **Fallback:** User redirected to /auth

### 🚀 Future Improvements

- [ ] Cross-tab session sync via BroadcastChannel
- [ ] Token refresh queue to prevent multiple simultaneous refreshes
- [ ] Offline mode with cached credentials
- [ ] Remember me checkbox to extend refreshToken TTL

---

**✅ SOLUTION COMPLETE - F5 không còn logout user!**

