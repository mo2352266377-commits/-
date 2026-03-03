import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // 关键：把 tailwindcss() 放在最前面
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
