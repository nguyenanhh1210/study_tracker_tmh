import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- IMPORT THÊM DÒNG NÀY

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Giúp nhận ra import từ /src/
      '/src': path.resolve(__dirname, 'src'), 
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
        external: ['react-contenteditable']
    }
  }
})