import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8081, // Changes the frontend server's port
  },
  plugins: [react()],
})
