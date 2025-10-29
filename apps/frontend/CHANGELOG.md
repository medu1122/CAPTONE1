# Frontend Changelog

## Version 1.2.0 - Major Feature Updates

### 🎉 New Features

#### SSE Streaming Integration
- **Real-time streaming responses** using Server-Sent Events (SSE)
- **Streaming text indicator** with typing animation
- **Timeout handling** (30 seconds) with automatic cleanup
- **Cache busting** to ensure fresh responses
- **Multiple response format support** (content, result.response, response)

#### Weather Integration
- **OpenWeather API integration** via backend proxy
- **Coordinates-based queries** (lat/lon) replacing city name queries
- **Predefined Vietnamese locations**: Hà Nội, TP.HCM, Đà Nẵng, Huế, Cần Thơ
- **Original city name display** (Vietnamese names preserved)
- **Real-time weather data** with temperature, humidity, description
- **Weather-aware plant suggestions**
- **Error handling with fallbacks** to cached data

#### Message Formatting
- **ReactMarkdown integration** for rich text formatting
- **Styled components** for all markdown elements:
  - Numbered lists (1. 2. 3.)
  - Bullet points
  - Headings (H1, H2, H3)
  - Bold and italic text
  - Code blocks (inline and block)
  - Blockquotes
  - Links with hover effects
  - Horizontal rules
- **Custom styling** matching app theme
- **Consistent formatting** between streaming and history messages

#### Image Upload & Analysis
- **Cloudinary integration** for image storage and CDN
- **Image compression** and optimization
- **Multiple upload methods**:
  - File picker
  - Drag & drop
  - Camera capture (mobile)
- **Image preview** before upload
- **Progress tracking** during upload
- **Error recovery** with fallback URLs
- **Plant.id API integration** for plant identification

### 🐛 Bug Fixes

#### Error Display
- **Fixed-position error overlay** - No longer pushes content down
- **Better error positioning** at top of viewport
- **Clear dismiss and retry actions**

#### Weather Display
- **City name display fix** - Shows original Vietnamese names instead of API transliteration
- **Coordinates-based queries** - More reliable than city name searches
- **Error handling** - Graceful fallbacks when weather data unavailable

#### Loading States
- **Removed duplicate loading overlays** - Single "Đang phân tích..." message
- **Better streaming indicators** - Clear visual feedback during AI response
- **Proper cleanup** - No lingering loading states

#### Message Display
- **ReactMarkdown for history** - Old messages now properly formatted
- **Consistent styling** - Same formatting for streaming and historical messages
- **Line breaks preserved** - Proper paragraph spacing

### 🔧 Technical Improvements

#### Services
- **streamingChatService.ts** - SSE connection management
- **weatherService.ts** - Weather API integration
- **geolocationService.ts** - Location detection
- **imageUploadService.ts** - Cloudinary integration
- **sessionService.ts** - Session management

#### Context
- **ChatAnalyzeContext.tsx** - Centralized state management
  - Message state
  - Streaming state
  - Conversation history
  - Error handling
  - Weather integration

#### API Configuration
- **Centralized API config** in `src/config/api.ts`
- **Environment variable support** with `VITE_` prefix
- **Multiple endpoint definitions**

#### Type Safety
- **Comprehensive TypeScript types**
- **Type-only imports** where applicable
- **Interface definitions** for all data structures

### 📦 Dependencies Added
- `react-markdown` - Markdown rendering
- `buffer` - Browser compatibility polyfill
- Cloudinary SDK (via imageUploadService)

### 🎨 UI/UX Improvements
- **Responsive image handling** - Proper sizing and optimization
- **Mobile-optimized interface** - Touch-friendly controls
- **Better error messages** - Clear, actionable feedback
- **Improved loading states** - Single, consistent loading indicator
- **Streamlined chat flow** - Cleaner message display

### 📝 Documentation
- **Updated README.md** with:
  - Services & Integrations section
  - Environment Variables guide
  - API Configuration details
  - Recent Improvements section
  - Comprehensive feature list

### 🔄 API Changes
- **SSE endpoint**: `POST /api/v1/chat-analyze/stream`
- **Weather endpoint**: `GET /api/v1/weather?lat={lat}&lon={lon}`
- **Image upload**: Direct to Cloudinary with backend fallback

### ⚠️ Breaking Changes
None - All changes are backward compatible

### 🚀 Performance
- **Image optimization** via Cloudinary CDN
- **Lazy loading** for components
- **LocalStorage caching** for conversations
- **Efficient streaming** with SSE

### 📊 Statistics
- **Files Changed**: 15+
- **Services Added**: 6
- **Components Updated**: 10+
- **Bug Fixes**: 8
- **New Features**: 4 major

---

## Previous Versions

### Version 1.1.0
- Initial chat functionality
- Basic message display
- LocalStorage persistence
- Conversation management

### Version 1.0.0
- Initial release
- Home page
- Authentication page
- Basic routing
