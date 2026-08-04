<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import { useEmceptionRuntime } from '../composables/useEmceptionRuntime'
import { EMCEPTION_VERSION } from '../utils/emception'
import { PYODIDE_VERSION } from '../utils/pyodide'
import { BRYTHON_VERSION } from '../utils/brython'

const { cppReady, pythonReady, brythonReady, downloading, progress, error, packages, installedCount, installedSize, cachedSizes, ensureChecked, downloadCpp, downloadPython, downloadBrython, downloadPackage, deletePackage, clear } = useEmceptionRuntime()
const source = ref<'all' | 'emception' | 'pyodide' | 'brython'>('all')
const installed = ref<'all' | 'installed' | 'missing'>('all')
const query = ref('')

onMounted(() => { void ensureChecked() })

const percent = computed(() => progress.value.total ? Math.min(100, Math.round(progress.value.loaded / progress.value.total * 100)) : 0)
const filteredPackages = computed(() => packages.value.filter((item) => {
  const matchesSource = source.value === 'all' || item.source === source.value
  const matchesInstalled = installed.value === 'all' || (installed.value === 'installed' ? item.installed : !item.installed)
  const search = query.value.trim().toLowerCase()
  return matchesSource && matchesInstalled && (!search || `${item.id} ${item.label || ''} ${item.description || ''} ${item.files?.join(' ') || ''}`.toLowerCase().includes(search))
}))
const formatSize = (bytes: number) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '由服务器提供'
</script>

<template>
  <div class="page-container env-page">
    <BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><h2><i class="fas fa-cogs" />开发环境</h2></div><div class="page-meta-right"><span class="status-badge" :class="cppReady && pythonReady && brythonReady ? 'status-ac' : 'status-wa'"><i class="fas fa-boxes-stacked" />{{ installedCount }} 个资源已安装</span></div></div></BaseCard>

    <BaseCard padding="lg" class="env-card">
      <h3 class="env-section-title"><i class="fas fa-download" />运行环境</h3>
      <p class="env-desc">C++ 工具链和 Python 解释器分别下载、缓存和清理。下方可管理当前版本提供的每一个资源包。</p>
      <div class="env-info-grid">
        <div class="env-info-item"><span class="env-info-label">C++ (WASM)</span><span class="env-info-value">{{ cppReady ? '已就绪' : '未完整安装' }} · emception v{{ EMCEPTION_VERSION }}</span></div>
        <div class="env-info-item"><span class="env-info-label">Python (WASM)</span><span class="env-info-value">{{ pythonReady ? '已就绪' : '未完整安装' }} · Pyodide v{{ PYODIDE_VERSION }}</span></div>
        <div class="env-info-item"><span class="env-info-label">Python (Brython)</span><span class="env-info-value">{{ brythonReady ? '已就绪' : '未完整安装' }} · Brython v{{ BRYTHON_VERSION }}</span></div>
        <div class="env-info-item"><span class="env-info-label">已缓存下载内容</span><span class="env-info-value">{{ formatSize(installedSize) }}</span><small class="env-cache-detail">Emception {{ formatSize(cachedSizes.emception) }} · Pyodide {{ formatSize(cachedSizes.pyodide) }} · Brython {{ formatSize(cachedSizes.brython) }}</small></div>
      </div>
      <div v-if="downloading" class="env-progress-wrap"><div class="env-progress"><div class="env-progress-bar" :style="{ width: `${percent}%` }" /></div><p class="env-progress-text"><i class="fas fa-circle-notch fa-spin" />正在下载 {{ progress.fileName || '资源' }}（{{ percent }}%）</p></div>
      <p v-if="error" class="env-error"><i class="fas fa-circle-exclamation" />{{ error }}</p>
      <div class="env-actions"><button class="btn-run" :disabled="downloading || cppReady" @click="downloadCpp"><i class="fas fa-microchip" />{{ cppReady ? 'C++ 工具链已就绪' : '下载 C++ 工具链' }}</button><button class="btn-run" :disabled="downloading || pythonReady" @click="downloadPython"><i class="fab fa-python" />{{ pythonReady ? 'Python 环境已就绪' : '下载 Python 环境' }}</button><button class="btn-run" :disabled="downloading || brythonReady" @click="downloadBrython"><i class="fab fa-python" />{{ brythonReady ? 'Brython 环境已就绪' : '下载 Brython 环境' }}</button><button class="btn-run btn-run-ghost" :disabled="downloading" @click="clear"><i class="fas fa-trash-can" />清除全部资源</button></div>
    </BaseCard>

    <BaseCard padding="lg" class="env-card">
      <div class="env-package-header"><h3 class="env-section-title"><i class="fas fa-boxes-stacked" />资源包管理</h3><span class="env-package-count">{{ filteredPackages.length }} / {{ packages.length }} 项</span></div>
      <div class="env-package-filters"><input v-model="query" class="env-package-search" placeholder="搜索包名或文件路径" /><select v-model="source"><option value="all">全部来源</option><option value="emception">C++ / Emception</option><option value="pyodide">Python / Pyodide</option><option value="brython">Python / Brython</option></select><select v-model="installed"><option value="all">全部状态</option><option value="installed">已安装</option><option value="missing">未安装</option></select></div>
      <div class="env-package-list"><article v-for="item in filteredPackages" :key="`${item.source}-${item.id}`" class="env-package-item"><div class="env-package-main"><div class="env-package-title"><strong>{{ item.label || item.id }}</strong><code>{{ item.id }}</code><span class="env-package-source">{{ item.source === 'emception' ? 'Emception' : item.source === 'pyodide' ? 'Pyodide' : 'Brython' }}</span></div><p>{{ item.description || `${item.files?.length || 0} 个文件` }}</p><small>{{ formatSize(item.size) }}<template v-if="item.files?.length"> · {{ item.files.length }} 个文件</template></small><details v-if="item.files?.length"><summary>查看文件</summary><code class="env-package-files">{{ item.files.slice(0, 12).join('\n') }}{{ item.files.length > 12 ? '\n…' : '' }}</code></details></div><div class="env-package-action"><span :class="['status-badge', item.installed ? 'status-ac' : 'status-wa']">{{ item.installed ? '已安装' : '未安装' }}</span><button v-if="!item.installed" class="btn-run btn-run-small" :disabled="downloading" @click="downloadPackage(item)">下载</button><button v-else class="btn-run btn-run-ghost btn-run-small" :disabled="downloading" @click="deletePackage(item)">删除</button></div></article></div>
    </BaseCard>
  </div>
</template>
