import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  publicDir: 'public',
  server: {
    port: 5173,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Întrebări din Biblie — Adevărat sau Fals?',
        short_name: 'Adevărat/Fals',
        description:
          'Quiz biblic True/False pentru doi jucători pe același telefon sau tabletă',
        theme_color: '#F7F5F2',
        background_color: '#F7F5F2',
        display: 'standalone',
        orientation: 'any',
        lang: 'ro',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell only — question MP3s cached on demand
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/packs/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'btf-packs',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 45,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/content-packs/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'btf-catalog',
            },
          },
        ],
      },
    }),
  ],
})
