import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase'))                                   return 'supabase'
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts'
            if (id.includes('xlsx') || id.includes('jspdf'))               return 'export'
            if (id.includes('react-dom') || id.includes('react/'))         return 'vendor'
          }
        },
      },
    },
  },
})
