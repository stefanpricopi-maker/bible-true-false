import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  publicDir: 'public',
  server: { port: 5175, strictPort: true },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Antrenament Memorare — Mishak',
        short_name: 'Memorare',
        description:
          'Antrenament pentru Memorarea Scripturii — Apocalipsa 1–5 (neoficial)',
        theme_color: '#F7F5F2',
        background_color: '#F7F5F2',
        display: 'standalone',
        lang: 'ro',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2,json}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
