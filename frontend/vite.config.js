import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env vars for the current mode so we can use them in config
  const env = loadEnv(mode, process.cwd(), '')

  // Local dev proxy target — falls back to localhost:8081 if not set
  const backendUrl = env.VITE_DEV_BACKEND_URL || 'http://localhost:8081'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: backendUrl.replace('http', 'ws'),
          ws: true,
          changeOrigin: true,
        }
      }
    }
  }
})
