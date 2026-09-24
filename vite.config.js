import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// The dev server proxies /api to the Go backend so the browser only ever talks
// to one origin — no CORS, and no URL differences between dev and production
// (nginx does the same job there).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8090',
          changeOrigin: true,
          // forwards the browser IP: the backend rate-limits per IP and reads
          // X-Forwarded-For, so without this every dev shares one bucket
          xfwd: true,
        },
      },
    },
  }
})
