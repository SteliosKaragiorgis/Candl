import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api/yf': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yf/, ''),
      },
      '/api/metaapi-provision': {
        target: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/metaapi-provision/, ''),
      },
      '/api/metaapi-client/new-york': {
        target: 'https://mt-client-api-v1.new-york.agiliumtrade.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/metaapi-client\/new-york/, ''),
      },
      '/api/metaapi-client/london': {
        target: 'https://mt-client-api-v1.london.agiliumtrade.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/metaapi-client\/london/, ''),
      },
      '/api/metaapi-client/singapore': {
        target: 'https://mt-client-api-v1.singapore.agiliumtrade.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/metaapi-client\/singapore/, ''),
      },
      '/api/metaapi-client/sydney': {
        target: 'https://mt-client-api-v1.sydney.agiliumtrade.ai',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/metaapi-client\/sydney/, ''),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TradeFlow',
        short_name: 'TradeFlow',
        theme_color: '#0047FF',
        background_color: '#f5f5f7',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
