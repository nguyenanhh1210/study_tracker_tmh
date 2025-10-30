import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Đảm bảo Vite tìm file từ thư mục 'src'
  // (Đây là phần code bị thiếu!)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})