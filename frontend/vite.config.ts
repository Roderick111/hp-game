import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'

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
  ],
})
