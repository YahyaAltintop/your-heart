import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Barındırıcı bir PORT verirse onu kullan (aksi halde Vite varsayılanı).
    port: process.env.PORT ? Number(process.env.PORT) : 7747,
  },
})
