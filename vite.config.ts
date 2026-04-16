import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { deleteDemoPlugin } from './vite-plugin-delete-demo'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  plugins: [react(), tailwindcss(), deleteDemoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
