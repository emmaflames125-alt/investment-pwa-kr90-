import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/investment-pwa-kr90-/',   // ← CHANGED TO YOUR REPO NAME
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'InvestTrack PWA',
        short_name: 'InvestTrack',
        description: 'Your personal investment portfolio tracker',
        theme_color: '#0ea5e9',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        start_url: '/investment-pwa-kr90/',   // ← CHANGED
        scope: '/investment-pwa-kr90/'        // ← CHANGED
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ]
})
