import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        // Proxy to Vercel backend - this avoids CORS issues during development
        target: process.env.VITE_API_URL || 'https://tml-backend.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // Keep /api in the path
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          utils: ['axios', 'react-hot-toast']
        }
      }
    }
  },
  define: {
    'process.env': process.env
  }
})
