import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The HTML entry is `app.html`, so that the repo's root `index.html` can be
 * the *built* site. That way GitHub Pages serves a working page whether it is
 * set to deploy from the branch or from the Actions workflow.
 *
 * This plugin (1) renames the built page to index.html and (2) makes the dev
 * server answer "/" with app.html.
 */
function htmlEntry() {
  return {
    name: 'html-entry',
    enforce: 'post',
    generateBundle(_, bundle) {
      const page = bundle['app.html']
      if (!page) return
      this.emitFile({ type: 'asset', fileName: 'index.html', source: page.source })
      delete bundle['app.html']
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url.startsWith('/?')) req.url = `/app.html${req.url.slice(1)}`
        next()
      })
    },
  }
}

// `base: './'` makes every asset URL relative, so the build works from any
// sub-path, which is what GitHub Pages (https://user.github.io/repo/) needs.
export default defineConfig({
  base: './',
  plugins: [react(), htmlEntry()],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: 'app.html',
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
