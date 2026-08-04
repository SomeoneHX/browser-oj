<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import { DEFAULT_THEME, getThemeSettings, type ThemeSettings } from '../utils/storage'
import { useTheme } from '../composables/useTheme'

const draft = ref<ThemeSettings>(getThemeSettings())
const { preview, save: saveTheme, restore } = useTheme()
const saved = ref(false)
const imageError = ref(false)
const previewStyle = computed(() => ({
  backgroundImage: draft.value.backgroundImage ? `url("${draft.value.backgroundImage}")` : 'none',
}))

watch(draft, (next) => preview(next), { deep: true })

function save() {
  saveTheme(draft.value)
  saved.value = true
  window.setTimeout(() => { saved.value = false }, 1800)
}

function reset() {
  draft.value = { ...DEFAULT_THEME }
  imageError.value = false
  saveTheme(draft.value)
  saved.value = true
  window.setTimeout(() => { saved.value = false }, 1800)
}

function onImageError() {
  imageError.value = true
}

onBeforeUnmount(() => restore())
</script>

<template>
  <div class="page-container theme-page">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left"><h2><i class="fas fa-palette" />主题设置</h2></div>
        <div class="page-meta-right"><span class="problem-count">设置仅保存在当前浏览器</span></div>
      </div>
    </BaseCard>

    <div class="theme-layout">
      <BaseCard padding="lg" class="theme-card">
        <h3 class="theme-section-title"><i class="fas fa-image" />背景与效果</h3>
        <label class="theme-field">
          <span class="theme-label">背景图片地址</span>
          <input v-model.trim="draft.backgroundImage" class="theme-input" type="url" placeholder="输入图片 URL，留空则不显示背景" @input="imageError = false" />
          <span class="theme-hint">建议使用 HTTPS 图片地址，以确保浏览器可以正常加载。</span>
        </label>
        <div class="theme-preview" :style="previewStyle">
          <span v-if="!draft.backgroundImage">背景预览</span>
          <span v-else-if="imageError" class="theme-preview-error"><i class="fas fa-triangle-exclamation" />图片加载失败</span>
          <img v-if="draft.backgroundImage" :src="draft.backgroundImage" alt="背景图片预览" @error="onImageError" />
        </div>
        <label class="theme-switch-row">
          <span><strong>全屏显示背景图片</strong><small>让背景覆盖整个浏览器视口</small></span>
          <input v-model="draft.backgroundFullScreen" type="checkbox" class="theme-switch" />
        </label>
        <label class="theme-switch-row">
          <span><strong>开启毛玻璃效果</strong><small>为页面卡片启用背景模糊</small></span>
          <input v-model="draft.glassEnabled" type="checkbox" class="theme-switch" />
        </label>
        <label class="theme-range-row">
          <span><strong>卡片透明度</strong><output>{{ Math.round(draft.opacity * 100) }}%</output></span>
          <input v-model.number="draft.opacity" type="range" min="0.2" max="1" step="0.01" />
        </label>
        <label class="theme-range-row" :class="{ 'theme-range-disabled': !draft.glassEnabled }">
          <span><strong>模糊强度</strong><output>{{ draft.blur }}px</output></span>
          <input v-model.number="draft.blur" type="range" min="0" max="24" step="1" :disabled="!draft.glassEnabled" />
        </label>
        <div class="theme-actions">
          <button class="btn-run" @click="save"><i class="fas fa-save" />{{ saved ? '已保存' : '保存设置' }}</button>
          <button class="btn-run btn-run-ghost" @click="reset"><i class="fas fa-rotate-left" />恢复默认</button>
        </div>
      </BaseCard>

      <BaseCard padding="lg" class="theme-card theme-tips-card">
        <h3 class="theme-section-title"><i class="fas fa-circle-info" />使用说明</h3>
        <ul class="env-list">
          <li>修改会立即应用于当前页面预览，离开页面后未保存的更改将恢复。</li>
          <li>点击“保存设置”后，主题配置会在刷新页面后继续保留。</li>
          <li>点击“恢复默认”会立即恢复并保存默认主题。</li>
          <li>透明度只影响卡片表面，不会降低文字和按钮的可读性。</li>
          <li>如果图片无法加载，请检查地址是否有效，以及图片服务器是否允许当前页面访问。</li>
        </ul>
      </BaseCard>
    </div>
  </div>
</template>
