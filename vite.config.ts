import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 删掉了之前的 define 配置，因为 Vite 会自动处理 VITE_ 开头的变量
})