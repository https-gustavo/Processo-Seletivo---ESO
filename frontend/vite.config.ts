import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        // Usa target configurável: em dev local aponta para localhost; em Docker usa "backend"
        target: process.env.VITE_API_PROXY_TARGET || (process.env.DOCKER ? 'http://backend:8080' : 'http://localhost:8080'),
        changeOrigin: true
      }
    }
  }
})
