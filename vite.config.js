import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  assetsInclude: ['**/*.md'],
  plugins: [vue()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['emception', '@gameguild/emception-browser', '@gameguild/emception-xterm', '@xterm/xterm'],
  },
  resolve: {
    alias: {
      util: path.resolve(__dirname, 'src/polyfills/util.js'),
      stream: path.resolve(__dirname, 'src/polyfills/stream.js'),
    },
  },
})
