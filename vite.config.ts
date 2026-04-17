import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    // Polyfill Node.js globals for browser-targeting libraries (xlsx, tesseract.js, etc.)
    'process': JSON.stringify({ env: { NODE_ENV: 'production' }, browser: true, version: '', versions: {}, platform: 'browser' }),
    'global': 'globalThis',
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'ffmpeg': ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
          'pdf': ['pdf-lib', 'pdfjs-dist'],
          'crypto-libs': ['openpgp', 'bcryptjs'],
          'data-libs': ['js-yaml', '@iarna/toml', 'papaparse', 'fast-xml-parser'],
        }
      }
    }
  }
})
