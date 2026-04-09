import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/NoLine/',
  server: {
    proxy: {
      // All requests to /api/qrng/* are forwarded to the ANU server-side.
      // Server-to-server requests bypass browser CORS restrictions entirely.
      '/api/qrng': {
        target: 'https://qrng.anu.edu.au',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/qrng/, '/API'),
        secure: true,
      },
    },
  },
})

