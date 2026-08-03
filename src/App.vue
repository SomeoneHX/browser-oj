<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const { logout } = useAuth()
const showNavbar = computed(() => route.path !== '/login')
</script>

<template>
  <template v-if="showNavbar">
    <Navbar @logout="logout" />
    <main class="main-content app-shell-content">
      <RouterView />
    </main>
  </template>
  <main v-else>
    <RouterView />
  </main>
</template>
