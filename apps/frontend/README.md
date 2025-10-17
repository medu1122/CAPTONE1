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
│   └── ChatAnalyzePage/ # Main chat analysis page
│       ├── components/
│       │   ├── analysis/    # Analysis result components
│       │   │   ├── ImageAnalysisCard.tsx
│       │   │   ├── OverviewCard.tsx
│       │   │   └── ProductListCard.tsx
│       │   ├── chat/        # Chat interface components
│       │   │   ├── ChatHeader.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   └── ChatMessages.tsx
│       │   ├── history/     # Chat history components
│       │   │   └── HistorySidebar.tsx
│       │   ├── layout/      # Layout components
│       │   │   └── Header.tsx
│       │   └── weather/     # Weather information components
│       │       └── WeatherLocationCard.tsx
│       ├── hooks/           # Custom React hooks
│       │   ├── useChat.ts
│       │   ├── useChatHistory.ts
│       │   └── useWeatherLocation.ts
│       ├── lib/             # Utility libraries
│       │   ├── mockApi.ts
│       │   └── storage.ts
│       ├── types/           # TypeScript type definitions
│       │   └── analyze.types.ts
│       ├── ChatAnalyzePage.tsx
│       └── index.tsx
├── assets/              # Static assets
│   ├── icons/           # Icon files
│   └── images/          # Image files
├── lib/                 # Utility functions
│   └── utils.ts
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

### 3. **Chat Analysis Page**
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
- **Type Safety**: Comprehensive TypeScript definitions with type-only imports
- **State Management**: Local storage integration for persistence
- **Weather Integration**: Mock weather API with realistic data generation

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
- `/chat` → Chat analysis page
- `/ChatAnalyzePage` → Alternative chat page route
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
