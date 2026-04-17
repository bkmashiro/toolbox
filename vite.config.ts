import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    // Some npm libraries (xlsx, tesseract.js, etc.) reference Node's `process`
    // Polyfill it so they don't crash in the browser
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
    'process.browser': 'true',
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
