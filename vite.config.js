import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  return {
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    cssCodeSplit: true,
    reportCompressedSize: false,
    // ── Terser en production : bundles 15-25% plus petits ────────────────
    // En dev, on désactive la minification pour des builds rapides
    minify: isProd ? 'terser' : false,
    terserOptions: isProd ? {
      compress: {
        drop_console:  true,     // supprime console.* en prod
        drop_debugger: true,
        pure_funcs:    ['console.log', 'console.info', 'console.debug'],
        passes:        2,        // double passe = meilleure compression
        ecma:          2020,
        dead_code:     true,
      },
      mangle: { safari10: false },
      format: { comments: false },
    } : undefined,
    // ── Inline les assets < 2 Ko en base64 (évite des requêtes HTTP) ─────
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // ── Chunk splitting strategy ──────────────────────────────────────
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // React core (loaded on every page — keep separate for long-term cache)
          if (id.includes('react-dom'))                                  return 'vendor-react-dom'
          if (id.includes('react-router') || id.includes('react-router-dom')) return 'vendor-router'
          if (id.includes('/react/') && !id.includes('react-dom'))       return 'vendor-react'

          // Auth (loaded on every page)
          if (id.includes('@supabase'))                                  return 'vendor-supabase'

          // PDF & document export (lazy, heavy)
          if (id.includes('html2pdf') || id.includes('html2canvas'))    return 'vendor-pdf-export'
          if (id.includes('jspdf'))                                      return 'vendor-jspdf'
          if (id.includes('pdfjs-dist'))                                 return 'vendor-pdfjs'

          // Data / office (lazy, heavy)
          if (id.includes('xlsx'))                                       return 'vendor-xlsx'
          if (id.includes('mammoth'))                                    return 'vendor-mammoth'
          if (id.includes('tesseract'))                                  return 'vendor-ocr'

          // Charts (lazy)
          if (id.includes('chart.js') || id.includes('chartjs'))        return 'vendor-charts'

          // Maps (lazy)
          if (id.includes('leaflet'))                                    return 'vendor-maps'

          // Editor (lazy)
          if (id.includes('@tiptap'))                                    return 'vendor-editor'

          // Swiper (home slider — loaded on home page)
          if (id.includes('swiper'))                                     return 'vendor-swiper'

          // QR code (lazy)
          if (id.includes('qrcode'))                                     return 'vendor-qrcode'

          // Web vitals (small, defer)
          if (id.includes('web-vitals'))                                 return 'vendor-web-vitals'

          // DOMPurify (small, shared)
          if (id.includes('dompurify'))                                  return 'vendor-dompurify'

          // Remaining — group by top-level package name
          const parts = id.split('node_modules/')[1]?.split('/')
          return parts?.[0] ? `vendor-${parts[0].replace('@', '')}` : 'vendor'
        },
        // ── Compact asset names in production ─────────────────────────────
        // Keep content hashes for long-term caching — Netlify headers rely on /assets/*
        compact: isProd,
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-router'],
  },
  server: {
    historyApiFallback: true,
    port: 5174,
    host: true,
  },
  define: {
    'import.meta.env.VITE_PAYDUNYA_MASTER_KEY': JSON.stringify(env.VITE_PAYDUNYA_MASTER_KEY || ''),
    'import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY': JSON.stringify(env.VITE_PAYDUNYA_PRIVATE_KEY || ''),
    'import.meta.env.VITE_PAYDUNYA_TOKEN': JSON.stringify(env.VITE_PAYDUNYA_TOKEN || ''),
    'import.meta.env.VITE_PAYDUNYA_MODE': JSON.stringify(env.VITE_PAYDUNYA_MODE || 'live'),
    'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY || ''),
    'import.meta.env.VITE_GROK_LLAMA_API_KEY': JSON.stringify(env.VITE_GROK_LLAMA_API_KEY || ''),
    'import.meta.env.VITE_GROQ_BASE_URL': JSON.stringify(env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'),
    'import.meta.env.VITE_GROQ_MODEL': JSON.stringify(env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'),
  },
  plugins: [
    react(),
    {
      name: 'netlify-functions-local',
      configureServer(server) {
        server.middlewares.use('/.netlify/functions/azure-tts', async (req, res, next) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = Buffer.concat(chunks).toString('utf-8')
          try {
            const fn = require(path.resolve('netlify/functions/azure-tts.js'))
            const result = await fn.handler({ httpMethod: 'POST', body })
            res.statusCode = result.statusCode || 200
            Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v))
            if (result.isBase64Encoded) {
              res.end(Buffer.from(result.body, 'base64'))
            } else {
              res.end(result.body)
            }
          } catch (e) {
            res.statusCode = 500
            res.end(e.message || 'Internal error')
          }
        })
      },
    },
  ],
  }
})
