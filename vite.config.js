import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  assetsInclude: ['**/*.md'],
  plugins: [react()],
  resolve: {
    alias: {
      util: path.resolve(__dirname, 'src/polyfills/util.js'),
      stream: path.resolve(__dirname, 'src/polyfills/stream.js'),
    },
  },
})
