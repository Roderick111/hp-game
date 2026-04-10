import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    imagetools({
      // Default output formats: AVIF, WebP, original
      defaultDirectives: (_url) => {
        // Generate multiple formats for all images
        return new URLSearchParams({
          format: 'avif;webp;png',
          quality: '75',
        })
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Auror Academy: Case Files',
        short_name: 'Auror Academy',
        description: 'Interactive detective investigation game',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/music\/.+\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'music', expiration: { maxEntries: 30, maxAgeSeconds: 90 * 24 * 3600 } },
          },
          {
            urlPattern: /\/(locations|portraits)\/.+\.(png|webp|avif|jpg)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 } },
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
