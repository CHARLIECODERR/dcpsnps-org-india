import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Improve chunking to avoid very large JS bundles
  build: {
    // raise warning limit slightly while we split vendor code
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('react-router-dom')) return 'router-vendor';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('@emailjs') || id.includes('emailjs')) return 'emailjs-vendor';
            if (id.includes('react-icons') || id.includes('@heroicons')) return 'icons-vendor';
            if (id.includes('react-toastify')) return 'toastify-vendor';
            // fallback for other node_modules
            return 'vendor';
          }
        },
      },
    },
  },
})
