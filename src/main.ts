import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'

createApp(App).use(router).mount('#app')

if ('serviceWorker' in navigator && !import.meta.env.SSR) {
  const swUrl = import.meta.env.BASE_URL + 'sw.js'
  const reloadedKey = 'browser_oj_sw_reloaded_worker_no_coep_v7'
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionStorage.getItem(reloadedKey)) return
    sessionStorage.setItem(reloadedKey, '1')
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).then((registration) => registration.update()).catch(() => {})
  })
}
