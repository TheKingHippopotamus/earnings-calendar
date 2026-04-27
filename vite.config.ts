import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Earnings Calendar — Forensic',
        short_name: 'Earnings',
        description: 'Forensic earnings calendar with growth, beats, fraud detection.',
        theme_color: '#0b0d12',
        background_color: '#0b0d12',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: './icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          'recharts': ['recharts'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'tanstack': ['@tanstack/react-table'],
          'fuse': ['fuse.js'],
        },
      },
    },
  },
})
