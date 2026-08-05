<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const emit = defineEmits<{ logout: [] }>()
const { nickname, avatarUrl } = useAuth()

const onAvatarError = (event: Event) => {
  ;(event.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
  <nav class="topbar">
    <div class="topbar-brand">
      <RouterLink to="/" class="navbar-brand"><i class="fas fa-code" /><span>Browser OJ</span></RouterLink>
      <span class="topbar-title">在线评测系统</span>
    </div>
    <div class="topbar-right">
      <div class="navbar-right">
        <template v-if="nickname">
          <span class="navbar-user">
            <img v-if="avatarUrl" class="navbar-avatar" :src="avatarUrl" :alt="`${nickname} 的头像`" @error="onAvatarError">
            <i v-else class="fas fa-user-circle" />
            {{ nickname }}
          </span>
          <button class="btn-logout" title="退出" @click="emit('logout')"><i class="fas fa-sign-out-alt" /></button>
        </template>
        <RouterLink v-else to="/login" class="navbar-login"><i class="fas fa-sign-in-alt" />登录</RouterLink>
      </div>
    </div>
  </nav>
  <aside class="sidebar">
    <nav class="sidebar-nav" aria-label="主导航">
      <RouterLink to="/" class="nav-link"><i class="fas fa-home" /><span>首页</span></RouterLink>
      <RouterLink to="/problems" class="nav-link"><i class="fas fa-list" /><span>题目</span></RouterLink>
      <RouterLink to="/discuss" class="nav-link"><i class="fas fa-comments" /><span>讨论</span></RouterLink>
      <RouterLink to="/article" class="nav-link"><i class="fas fa-newspaper" /><span>文章</span></RouterLink>
      <RouterLink to="/ide" class="nav-link"><i class="fas fa-terminal" /><span>IDE</span></RouterLink>
      <RouterLink to="/environment" class="nav-link"><i class="fas fa-cogs" /><span>开发环境</span></RouterLink>
      <RouterLink to="/theme" class="nav-link"><i class="fas fa-palette" /><span>主题设置</span></RouterLink>
      <RouterLink to="/record" class="nav-link"><i class="fas fa-history" /><span>评测记录</span></RouterLink>
    </nav>
  </aside>
</template>
