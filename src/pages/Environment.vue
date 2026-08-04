<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import { useEmceptionRuntime } from '../composables/useEmceptionRuntime'
import { EMCEPTION_VERSION } from '../utils/emception'

const { ready, residue, fullInstalled, downloading, progress, error, ensureChecked, download, clear } = useEmceptionRuntime()

onMounted(() => {
  void ensureChecked()
})

const percent = computed(() => {
  if (!progress.value.total) return 0
  return Math.min(100, Math.round((progress.value.loaded / progress.value.total) * 100))
})

const loadedMb = computed(() => ((progress.value.loaded || 0) / 1024 / 1024).toFixed(1))
const totalMb = computed(() => ((progress.value.total || 0) / 1024 / 1024).toFixed(1))

const statusInfo = computed(() => {
  if (downloading.value) return { cls: 'status-running', text: '下载中', icon: 'fa-download' }
  if (ready.value) return { cls: 'status-ac', text: '已就绪', icon: 'fa-check-circle' }
  if (residue.value) return { cls: 'status-wa', text: '未完成', icon: 'fa-circle-question' }
  return { cls: 'status-wa', text: '未下载', icon: 'fa-circle-question' }
})
</script>

<template>
  <div class="page-container env-page">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left">
          <h2><i class="fas fa-cogs" />开发环境</h2>
        </div>
        <div class="page-meta-right">
          <span :class="['status-badge', statusInfo.cls]"><i :class="['fas', statusInfo.icon]" />{{ statusInfo.text }}</span>
        </div>
      </div>
    </BaseCard>

    <BaseCard padding="lg" class="env-card">
      <h3 class="env-section-title"><i class="fas fa-microchip" />C++ (WASM) 编译器运行时</h3>
      <p class="env-desc">
        「C++ (WASM)」使用 Emception（浏览器内的 clang / lld 工具链，编译为 WebAssembly），
        无需服务器即可在浏览器中完成 C++ 代码的编译与运行。首次使用需要下载
        <strong>核心包（约 45 MB）</strong>，下载完成后资源会缓存在本地，
        之后可离线编译运行。
      </p>
      <div class="env-info-grid">
        <div class="env-info-item"><span class="env-info-label">资源版本</span><span class="env-info-value">v{{ EMCEPTION_VERSION }}</span></div>
        <div class="env-info-item"><span class="env-info-label">核心包大小</span><span class="env-info-value">约 45 MB</span></div>
        <div class="env-info-item"><span class="env-info-label">完整包大小</span><span class="env-info-value">约 130 MB</span></div>
        <div class="env-info-item"><span class="env-info-label">使用位置</span><span class="env-info-value">语言选择「C++ (WASM)」</span></div>
      </div>
      <div v-if="downloading" class="env-progress-wrap">
        <div class="env-progress"><div class="env-progress-bar" :style="{ width: `${percent}%` }" /></div>
        <p class="env-progress-text"><i class="fas fa-circle-notch fa-spin" />正在下载 {{ loadedMb }} / {{ totalMb }} MB（{{ percent }}%）</p>
        <p v-if="progress.fileName" class="env-progress-file">
          <i class="fas fa-file-arrow-down" />{{ progress.fileName }}（{{ ((progress.fileLoaded || 0) / 1024 / 1024).toFixed(1) }} / {{ ((progress.fileTotal || 0) / 1024 / 1024).toFixed(1) }} MB）
        </p>
      </div>
      <p v-if="error" class="env-error"><i class="fas fa-circle-exclamation" />{{ error }}</p>
      <div class="env-actions">
        <button class="btn-run" :disabled="downloading || ready" @click="download(true)">
          <i :class="['fas', downloading ? 'fa-circle-notch fa-spin' : 'fa-download']" />{{ downloading ? '下载中...' : ready ? '核心包已就绪' : '下载核心包（约 45 MB）' }}
        </button>
        <button class="btn-run btn-run-ghost" :disabled="downloading" @click="download(false)">
          <i class="fas fa-box-open" />{{ fullInstalled ? '完整包已就绪' : '下载完整包（约 130 MB）' }}
        </button>
        <button class="btn-run btn-run-ghost" :disabled="downloading" @click="clear">
          <i class="fas fa-trash-can" />清除资源
        </button>
      </div>
      <p v-if="ready" class="env-ready-hint"><i class="fas fa-circle-check" />资源已就绪，现在可以在评测或在线 IDE 中选择「C++ (WASM)」。</p>
      <p v-if="!ready && residue" class="env-residue-hint"><i class="fas fa-triangle-exclamation" />检测到未下载完成的残留缓存，可点击「清除资源」后重新下载。</p>
    </BaseCard>

    <BaseCard padding="lg" class="env-card">
      <h3 class="env-section-title"><i class="fas fa-circle-info" />说明</h3>
      <ul class="env-list">
        <li>核心包已包含评测与在线 IDE 所需的全部工具（clang 编译器、wasm-ld 链接器、libc/libc++ 标准库头文件与链接库）。</li>
        <li>完整包额外包含 CMake、Python、SDL3 / raylib 图形库等高级资源的离线缓存，仅在未来功能扩展或需要完全离线时使用；已下载核心包后可直接补下，无需清除。</li>
        <li>资源通过 jsDelivr CDN 下载（固定版本 emception@{{ EMCEPTION_VERSION }}），并由 Service Worker 缓存，下载完成后无需联网。</li>
        <li>下载采用并行策略（同时下载 3 个文件），某个文件首次下载较慢（CDN 冷缓存）属正常现象，只要持续有数据就会一直下载直到完成；只有完全停滞 60 秒才会自动切换到其他 CDN 节点重试。</li>
        <li>个别文件多次重试仍失败时，已完成的部分会保留在缓存中，重新下载会自动跳过，只补下缺失的文件。</li>
        <li>下载中断时残留的缓存可随时在本页点击「清除资源」释放。</li>
        <li>首次编译某个程序时较慢（需加载工具链），之后的编译会明显加快。</li>
      </ul>
    </BaseCard>
  </div>
</template>
