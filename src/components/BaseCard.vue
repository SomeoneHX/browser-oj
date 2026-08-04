<script setup lang="ts">
withDefaults(defineProps<{ padding?: 'none' | 'sm' | 'md' | 'lg'; flush?: boolean }>(), {
  padding: 'md',
  flush: false,
})
</script>

<template>
  <div class="base-card" :class="flush ? 'base-card--flush' : `base-card--${padding}`">
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background: rgba(255, 255, 255, 0.72);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.base-card--none { padding: 0; }
.base-card--sm { padding: 12px 16px; }
.base-card--md { padding: 20px 24px; }
.base-card--lg { padding: 24px 28px; }

.base-card--flush { overflow: hidden; }
</style>
