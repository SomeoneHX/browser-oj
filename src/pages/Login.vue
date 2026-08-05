<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const API_BASE = 'https://api.luogu.me'
const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 30
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
const values = new Uint32Array(12)
crypto.getRandomValues(values)
const verificationCode = `browser-oj-${Array.from(values, (value) => alphabet[value % alphabet.length]).join('')}`
const pasteId = ref('')
const status = ref('')
const error = ref('')
const verifying = ref(false)
const router = useRouter()
const { login } = useAuth()

interface ApiEnvelope<T> {
  code: number
  message?: string
  data?: T
}

interface PasteSaveWorkflow {
  workflowId?: string
}

interface WorkflowTask {
  taskName?: string
  type?: string
  status?: string
}

interface WorkflowState {
  status?: string
  tasks?: WorkflowTask[]
}

interface PasteAuthor {
  name?: string
  uid?: string | number
  id?: string | number
}

interface PasteData {
  deleted?: boolean
  content?: string
  author?: PasteAuthor
  uid?: string | number
  id?: string | number
  user?: { uid?: string | number }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
async function requestJson<T>(url: string, options?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(url, { ...options, headers: { 'User-Agent': 'Browser-OJ', ...(options?.headers || {}) } })
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !body || body.code !== 200) throw new Error(body?.message || `请求失败（${response.status}）`)
  return body
}

async function submit() {
  const trimmed = pasteId.value.trim()
  if (!trimmed || verifying.value) return
  verifying.value = true
  error.value = ''
  status.value = '正在同步洛谷剪贴板...'
  try {
    const workflow = await requestJson<PasteSaveWorkflow>(`${API_BASE}/workflow/create/template/paste-save-pipeline`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: trimmed }) })
    const workflowId = workflow.data?.workflowId
    if (!workflowId) throw new Error('同步任务创建失败')
    let workflowData: WorkflowState | undefined
    let saveCompleted = false
    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      if (attempt > 0) await sleep(POLL_INTERVAL_MS)
      const result = await requestJson<WorkflowState>(`${API_BASE}/workflow/query/${encodeURIComponent(workflowId)}`)
      workflowData = result.data
      status.value = `正在同步洛谷剪贴板... (${attempt + 1}/${MAX_POLLS})`
      const task = workflowData?.tasks?.find((item) => item.taskName === 'save' || item.type === 'save')
      if (task?.status === 'completed') { saveCompleted = true; break }
      if (task && ['failed', 'cancelled', 'canceled', 'error'].includes(task.status || '')) throw new Error('洛谷剪贴板同步失败')
      if (['failed', 'cancelled', 'canceled', 'error'].includes(workflowData?.status || '')) throw new Error('洛谷剪贴板同步失败')
    }
    if (!saveCompleted) throw new Error('洛谷剪贴板同步超时，请稍后重试')
    status.value = '正在验证剪贴板内容...'
    const paste = await requestJson<PasteData>(`${API_BASE}/paste/query/${encodeURIComponent(trimmed)}`)
    const data = paste.data
    if (data?.deleted) throw new Error('这个洛谷剪贴板已被删除')
    if (data?.content?.trim() !== verificationCode) throw new Error('剪贴板内容与验证文本不一致')
    if (!data?.author?.name) throw new Error('未能获取洛谷用户名')
    const uid = data.author.uid ?? data.author.id ?? data.uid ?? data.user?.uid
    login(data.author.name, uid)
    await router.replace('/')
  } catch (err) {
    status.value = ''
    error.value = (err as Error).message || '登录验证失败，请重试'
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <div class="login-page"><div class="login-card">
    <div class="login-header"><i class="fas fa-code login-icon" /><h1>Browser OJ</h1><p class="login-subtitle">使用洛谷剪贴板登录</p></div>
    <form class="login-form" @submit.prevent="submit">
      <div class="login-instructions"><p class="login-notice">当前登录完全没有用。</p><p>1. 将下面的验证文本完整写入一个洛谷剪贴板。</p><code>{{ verificationCode }}</code><p>2. 输入洛谷剪贴板 ID，系统会同步并验证剪贴板作者。</p></div>
      <div class="login-field"><i class="fas fa-paste" /><input v-model="pasteId" type="text" placeholder="输入洛谷剪贴板 ID" maxlength="64" autofocus /></div>
      <p v-if="status" class="login-status"><i class="fas fa-spinner fa-spin" />{{ status }}</p>
      <p v-if="error" class="login-error"><i class="fas fa-circle-exclamation" />{{ error }}</p>
      <button type="submit" class="btn-login" :disabled="!pasteId.trim() || verifying"><i :class="['fas', verifying ? 'fa-spinner fa-spin' : 'fa-sign-in-alt']" />{{ verifying ? '验证中...' : '登录' }}</button>
    </form>
  </div></div>
</template>
