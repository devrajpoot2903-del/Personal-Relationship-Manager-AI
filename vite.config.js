import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the same build works on Vercel, Netlify and
  // GitHub Pages project sites (which serve from /<repo>/).
  base: './',

  plugins: [react(), tailwindcss()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    // Dev/preview hosts are proxied under e2b.app, so allow the sandbox domain.
    allowedHosts: ['.e2b.app', '.e2b.dev', 'localhost'],
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.e2b.app', '.e2b.dev', 'localhost'],
  },
})
