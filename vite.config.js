import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  assetsInclude: ['**/*.md'],
  plugins: [vue()],
  resolve: {
    alias: {
      util: path.resolve(__dirname, 'src/polyfills/util.js'),
      stream: path.resolve(__dirname, 'src/polyfills/stream.js'),
    },
  },
})
