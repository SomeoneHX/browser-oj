<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuth } from './composables/useAuth'
import { useEmceptionRuntime } from './composables/useEmceptionRuntime'

const route = useRoute()
const { logout } = useAuth()
const { ensureChecked } = useEmceptionRuntime()
const showNavbar = computed(() => route.path !== '/login')

onMounted(() => {
  void ensureChecked()
})
</script>

<template>
  <template v-if="showNavbar">
    <Navbar @logout="logout" />
    <main class="main-content app-shell-content">
      <div class="page-bg" aria-hidden="true"></div>
      <RouterView />
    </main>
  </template>
  <main v-else>
    <RouterView />
  </main>
</template>
