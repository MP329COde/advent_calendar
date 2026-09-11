import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: "Calendrier de l'Avent",
        short_name: 'Avent',
        description: "Un défi, une surprise par jour jusqu'à Noël.",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a14',
        theme_color: '#0a0a14',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pas de navigateFallback ni de règle runtimeCaching sur /api : les
        // réponses API ne sont jamais interceptées par le service worker,
        // le contenu des cases doit toujours être re-vérifié par le serveur
        // à chaque requête (voir anti-triche daysController.js).
        runtimeCaching: [
          {
            urlPattern: /^\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
