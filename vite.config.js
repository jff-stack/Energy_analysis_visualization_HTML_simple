import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` makes every asset URL relative, so the build works from any
// sub-path — exactly what GitHub Pages (https://user.github.io/repo/) needs.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keep heavy animation libraries in their own long-lived chunk.
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion', 'gsap', 'lenis'],
        },
      },
    },
  },
})
