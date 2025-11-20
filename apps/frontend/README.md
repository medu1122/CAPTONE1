# Frontend - Plant Analysis Chat Application

A modern React + TypeScript + Vite application for plant analysis and chat functionality. This application provides an intuitive interface for users to analyze plants through chat interactions and view detailed analysis results.

## 🚀 Tech Stack

- **React 19.1.1** - Modern React with latest features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   └── ui/              # Base UI components (Button, Card, Input, Toast)
├── pages/               # Page components
│   ├── Home/            # Landing page
│   │   ├── components/
│   │   │   ├── CommunityMarketplace.tsx
│   │   │   ├── FarmerCommunity.tsx
│   │   │   ├── FeatureHighlights.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   └── HowItWorks.tsx
│   │   └── index.tsx
│   ├── AuthPage/        # Authentication page
│   │   ├── components/
│   │   │   ├── AuthCard.tsx
│   │   │   ├── LoginFrom.tsx
│   │   │   ├── RegisterFrom.tsx
│   │   │   └── VerificationScreen.tsx
│   │   ├── AuthPage.tsx
│   │   └── index.tsx
│   ├── PlantAnalysisPage/ # Plant image analysis page (NEW)
│   │   ├── components/
│   │   │   ├── PlantInfoCard.tsx      # Plant identification info
│   │   │   ├── DiseaseListCard.tsx    # Disease detection list
│   │   │   └── TreatmentPanel.tsx     # Treatment recommendations
│   │   ├── hooks/
│   │   │   └── useImageAnalysis.ts    # Image upload & analysis logic
│   │   ├── services/
│   │   │   └── analysisService.ts     # API calls for analysis
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── PlantAnalysisPage.tsx
│   │   └── index.ts
│   ├── KnowledgePage/   # AI Knowledge Chat page (NEW)
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx      # Chat UI
│   │   │   └── KnowledgeHeader.tsx    # Page header
│   │   ├── hooks/
│   │   │   └── useKnowledgeChat.ts    # Chat logic
│   │   ├── services/
│   │   │   └── chatService.ts         # Chat API calls
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── KnowledgePage.tsx
│   │   └── index.ts
│   └── ChatAnalyzePage/ # Legacy chat analysis page (DEPRECATED)
├── assets/              # Static assets
│   ├── icons/           # Icon files
│   └── images/          # Image files
├── contexts/            # React Context providers
│   ├── AuthContext.tsx        # Authentication state
│   └── ChatAnalyzeContext.tsx # Chat analysis state
├── hooks/               # Custom React hooks
│   ├── useErrorHandler.ts     # Error handling hook
│   ├── usePersistentState.ts  # LocalStorage state hook
│   ├── useStreamingResponse.tsx # SSE streaming hook
│   └── useVoiceInput.tsx       # Voice input hook
├── lib/                 # Utility functions
│   └── utils.ts
├── services/            # API service functions
│   ├── analysesService.ts      # Plant analysis API
│   ├── authService.ts          # Authentication API
│   ├── chatAnalyzeService.ts   # Chat analysis API
│   ├── chatHistoryService.ts   # Chat history API
│   ├── emailVerificationService.ts # Email verification API
│   ├── geolocationService.ts   # Location services
│   ├── imageUploadService.ts   # Image upload to Cloudinary (NEW)
│   ├── plantBoxService.ts      # Plant box management
│   ├── profileService.ts       # User profile API
│   ├── sessionService.ts       # Chat session API
│   ├── streamingChatService.ts # SSE chat streaming
│   ├── streamingService.ts     # SSE general streaming
│   └── weatherService.ts       # Weather API
├── App.tsx              # Main app component
├── App.css              # Global styles
├── index.css            # Base styles
└── main.tsx             # Application entry point
```

## 🎯 Key Features

### 1. **Home Page**
- Hero section with compelling call-to-action
- Feature highlights showcasing app capabilities
- How it works section explaining the process
- Community marketplace integration
- Farmer community section

### 2. **Authentication Page**
- **Login Form**: Email/password authentication with validation
- **Registration Form**: Complete signup with password strength indicator
- **Email Verification**: Post-registration email verification flow
- **Dark/Light Mode**: System preference detection with manual toggle
- **Toast Notifications**: Success/error feedback system
- **Form Validation**: Real-time validation with error messages
- **Password Security**: Strength meter and requirements checklist

### 3. **Plant Analysis Page** (NEW)
- **Image Upload & Analysis**: Upload plant images for identification and disease detection
- **Manual Analysis Flow**: Upload → Click "Phân tích" → View results → Reset for new analysis
- **Plant Information Display**: 
  - Plant name (common & scientific)
  - Confidence scores with visual indicators
  - Health status (healthy/diseased)
- **Disease Detection**: 
  - List of all detected diseases sorted by confidence
  - Disease icons and confidence badges
  - Detailed disease descriptions
- **Treatment Recommendations**:
  - **Chemical Treatments**: Grid of product cards with detailed modals
    - Product images, active ingredients, manufacturer
    - Target crops and diseases
    - Dosage, usage, frequency, isolation period
    - Safety precautions and pricing
  - **Biological Methods**: List of organic treatment methods
  - **Cultural Practices**: Agricultural best practices
  - Empty state messages when no treatments found
- **Responsive Design**: Mobile-first with adaptive layouts

### 4. **Knowledge Page** (NEW)
- **AI-Powered Chat**: Conversational AI for plant care questions
- **Context-Aware Responses**: AI reads from analysis panel when available
- **Knowledge Base**: Access to agricultural knowledge and best practices
- **Clean Interface**: Focused chat experience without analysis clutter

### 5. **Chat Analysis Page** (Legacy - DEPRECATED)
- **Real-time Chat Interface**: Interactive chat with plant analysis AI
- **Weather Integration**: Current weather information with:
  - Location-based weather data
  - 7-day forecast display
  - Weather-aware plant care suggestions
  - Location selector with search functionality
- **Analysis Results Panel**: Detailed analysis with:
  - Overview cards with key insights
  - Image analysis results with bounding boxes
  - Product recommendations
- **Chat History**: Persistent conversation history with:
  - Sidebar navigation with rail mode
  - Conversation management (create, rename, delete)
  - Keyboard shortcuts (Ctrl+B to toggle sidebar)
  - Focus trap and accessibility features
- **Responsive Design**: Mobile-first approach with adaptive layouts

### 4. **Component Architecture**
- **Modular Design**: Separated concerns with dedicated component folders
- **Custom Hooks**: Reusable logic with:
  - `useChat`: Chat functionality and message management
  - `useChatHistory`: Conversation history and persistence
  - `useWeatherLocation`: Weather data fetching and location management
  - `useImageAnalysis`: Image upload, analysis, and result management (NEW)
  - `useKnowledgeChat`: Knowledge page chat functionality (NEW)
- **Type Safety**: Comprehensive TypeScript definitions with type-only imports
- **State Management**: Local storage integration for persistence
- **Weather Integration**: Mock weather API with realistic data generation

### 5. **Treatment System** (NEW)
- **Three Treatment Types**:
  - **Chemical (Thuốc Hóa học)**: Product cards with detailed modals
  - **Biological (Phương pháp Sinh học)**: Organic treatment methods
  - **Cultural (Biện pháp Canh tác)**: Agricultural best practices
- **Disease-Based Recommendations**: Treatments filtered by detected diseases
- **Product Details Modal**: 
  - Click product card to view full details
  - Target crops and diseases
  - Dosage, usage instructions, frequency
  - Safety precautions and pricing
- **Empty States**: Clear messages when no treatments available
- **Data Source**: Treatments imported from Google Sheets → MongoDB

## 📋 ChatAnalyzePage Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header (Navigation & Authentication)                        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────┐ │
│ │ History     │ │ Weather Card (Top)                     │ │
│ │ Sidebar     │ ├─────────────────────────────────────────┤ │
│ │ (Rail Mode) │ │ ┌─────────────┐ ┌─────────────────────┐ │ │
│ │             │ │ │ Chat        │ │ Analysis Panel      │ │ │
│ │             │ │ │ Interface   │ │ - Overview Card     │ │ │
│ │             │ │ │ - Messages  │ │ - Image Analysis    │ │ │
│ │             │ │ │ - Input     │ │ - Product List      │ │ │
│ │             │ │ └─────────────┘ └─────────────────────┘ │ │
│ └─────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
```
ChatAnalyzePage
├── Header (Layout)
├── HistorySidebar
│   ├── Rail Mode (Desktop)
│   ├── Full Sidebar (Mobile)
│   └── Conversation Management
├── WeatherLocationCard
│   ├── Location Selector
│   ├── Current Weather
│   └── 7-Day Forecast
├── Chat Section
│   ├── ChatHeader
│   ├── ChatMessages
│   └── ChatInput
└── Analysis Panel
    ├── OverviewCard
    ├── ImageAnalysisCard
    └── ProductListCard
```

### Key Features
- **Weather Integration**: Real-time weather data with location switching
- **Responsive Layout**: Mobile-first design with adaptive components
- **Accessibility**: Focus management, keyboard navigation, ARIA labels
- **State Management**: Persistent chat history and weather preferences
- **Type Safety**: Comprehensive TypeScript interfaces and type-only imports

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

## 🎨 Styling & UI

- **Tailwind CSS**: Utility-first styling approach
- **Responsive Design**: Mobile-first responsive layouts
- **Component Library**: Custom UI components built on Radix UI
- **Icons**: Lucide React icon library
- **Animations**: Tailwind CSS animations

## 🔧 Configuration

### Vite Configuration
- Path aliases configured (`@` points to `src/`)
- React SWC plugin for fast compilation
- TypeScript support

### ESLint Configuration
- TypeScript-aware linting rules
- React-specific linting
- Modern ESLint flat config format

## 📱 Routing

The application uses React Router DOM with the following routes:
- `/` → Redirects to `/home`
- `/home` → Landing page
- `/auth` → Authentication page (login/register)
- `/login` → Authentication page (login focused)
- `/register` → Authentication page (register focused)
- `/analyze` → **Plant Analysis Page** (NEW) - Image upload & analysis
- `/knowledge` → **Knowledge Page** (NEW) - AI chat for plant care questions
- `/chat` → Chat analysis page (Legacy - DEPRECATED)
- `/ChatAnalyzePage` → Alternative chat page route (Legacy - DEPRECATED)
- `/profile` → User profile page
- `/my-plants` → User's plant management page
- `/community` → Community posts and discussions
- `*` → 404 Not Found page

## 🚀 Performance Features

- **Code Splitting**: Automatic route-based code splitting
- **Fast Refresh**: Hot module replacement for development
- **Tree Shaking**: Unused code elimination
- **TypeScript**: Compile-time type checking
- **SWC**: Fast compilation with Rust-based tooling

## 🔧 Advanced Configuration

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
