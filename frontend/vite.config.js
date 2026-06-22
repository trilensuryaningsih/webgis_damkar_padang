import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy panggilan /api ke backend production saat dev,
    // supaya tidak kena CORS dari localhost (request diteruskan server-side).
    proxy: {
      '/api': {
        target: 'https://damkar2.suralayateknik.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
