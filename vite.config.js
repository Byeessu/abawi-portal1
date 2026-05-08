import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/')[1]?.split('/')
            if (parts?.[0]) {
              return `vendor-${parts[0].replace('@', '')}`
            }
            return 'vendor'
          }
        },
      },
    },
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
      ],
  }
})
