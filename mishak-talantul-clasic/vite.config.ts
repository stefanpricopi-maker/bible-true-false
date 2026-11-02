import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  publicDir: 'public',
  server: { port: 5176, strictPort: true },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Antrenament Clasic — Mishak',
        short_name: 'Antrenament Clasic',
        description:
          'Pregătire coop părinte–copil pentru tipurile de întrebări din secțiunea Clasic (neoficial)',
        theme_color: '#163830',
        background_color: '#0f2a24',
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
