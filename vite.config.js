import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    css: true,
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/server/**',
    ],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/components/common/{Accordion,Badge,Button,Card,Input,Modal}.jsx',
        'src/components/layout/Breadcrumb.jsx',
        'src/pages/customer/Checkout.jsx',
        'src/pages/content/OrderTracking.jsx',
        'src/utils/api.js',
        'src/utils/formatPrice.js',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/*.{config,conf}.{js,ts,mjs,cjs}**',
        '**/src/main.jsx',
        '**/src/main.tsx',
        '**/server/**',
        '**/src/**/*.test.*',
        '**/src/test/**',
      ],
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 100,
        functions: 100,
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    hmr: {
      host: 'localhost',
      protocol: 'ws'
    },

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000', // ⚠️ change localhost → 127.0.0.1
        changeOrigin: true,
        secure: false
      },

      '/socket.io': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        ws: true,
        secure: false
      },

      '/uploads': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})