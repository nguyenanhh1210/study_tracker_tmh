import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Đây là file config gốc chuẩn nhất, không cần thêm gì cả.
export default defineConfig({
  plugins: [react()],
})