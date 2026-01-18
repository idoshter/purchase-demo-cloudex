import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/adk-api': {
        target: 'https://procurement-agent-758183203798.europe-west1.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adk-api/, ''),
      },
    }
  }
});