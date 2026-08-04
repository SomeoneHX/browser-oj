<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuth } from './composables/useAuth'
import { useEmceptionRuntime } from './composables/useEmceptionRuntime'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const { logout } = useAuth()
const { ensureChecked } = useEmceptionRuntime()
const { settings } = useTheme()
const showNavbar = computed(() => route.path !== '/login')
const backgroundStyle = computed(() => ({
  backgroundImage: settings.value.backgroundImage ? `url("${settings.value.backgroundImage}")` : 'none',
}))

onMounted(() => {
  void ensureChecked()
})
</script>

<template>
  <template v-if="showNavbar">
    <Navbar @logout="logout" />
    <main class="main-content app-shell-content">
      <div class="page-bg" :class="{ 'page-bg--fullscreen': settings.backgroundFullScreen }" :style="backgroundStyle" aria-hidden="true"></div>
      <RouterView />
    </main>
  </template>
  <main v-else>
    <RouterView />
  </main>
</template>
