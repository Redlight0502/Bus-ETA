import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/Bus-ETA/', // Matches your repo name
  plugins: [vue()],
});