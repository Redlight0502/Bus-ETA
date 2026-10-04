import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/Bus-ETA/', // 👈 確保加上 Repo 名稱
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000'
    }
  }
});
