import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react-swc'
import { Buffer } from 'buffer'

// https://vite.dev/config/
// __dirname is not available in ESM; recreate it
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process': '{}',
    'Buffer': Buffer,
  },
  optimizeDeps: {
    include: ['cloudinary'],
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces for LAN access
    port: 5173, // Default Vite port
    fs: {
      allow: ['..']
    }
  }
})
