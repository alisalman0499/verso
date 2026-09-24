import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The browser only ever talks to Vite's origin; Vite forwards /api to
    // the API. Same origin means auth cookies just work — no CORS and no
    // cross-site cookie settings. Production serves both from one domain too.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
