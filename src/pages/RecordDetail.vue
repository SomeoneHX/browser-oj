<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubmissions } from '../composables/useSubmissions'
import BaseCard from '../components/BaseCard.vue'

const route = useRoute()
const router = useRouter()
const { getById } = useSubmissions()
const sub = computed(() => getById(route.params.recordId))
const formatTime = (ts) => { const d = new Date(ts); const pad = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
const formatDuration = (ms) => typeof ms !== 'number' ? '-' : ms < 1 ? '<1 ms' : `${ms.toFixed(2)} ms`
const statusConfig = (status) => ({ running: ['fa-spinner fa-spin', '评测中', '#1677ff'], tle: ['fa-clock', '运行超时', '#f5222d'], error: ['fa-exclamation-circle', '运行错误', '#f5222d'], ac: ['fa-check-circle', '通过', '#52c41a'] }[status] || ['fa-times-circle', '未通过', '#faad14'])
const testConfig = (tc) => { const status = tc.status || (tc.passed ? 'passed' : 'failed'); return { statusClass: status === 'running' ? 'tc-running' : ['skipped', 'pending'].includes(status) ? 'tc-pending' : tc.passed ? 'tc-ok' : tc.error ? 'tc-err' : 'tc-no', icon: status === 'running' ? 'fa-spinner fa-spin' : tc.passed ? 'fa-check-circle' : tc.error ? 'fa-exclamation-circle' : status === 'timeout' ? 'fa-clock' : status === 'skipped' ? 'fa-forward' : 'fa-times-circle', label: status === 'running' ? '运行中' : status === 'pending' ? '等待中' : status === 'skipped' ? '已跳过' : tc.passed ? '通过' : status === 'timeout' ? '超时' : tc.error ? '运行错误' : '未通过' } }
const goBack = () => router.back()
</script>

<template>
  <div v-if="!sub" class="page-container"><div class="not-found"><i class="fas fa-question-circle" /><h2>提交记录不存在</h2><button type="button" class="btn-back" @click="goBack"><i class="fas fa-arrow-left" />返回</button></div></div>
  <div v-else class="page-container"><BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><h2><button type="button" class="header-back-link" aria-label="返回上一页" @click="goBack"><i class="fas fa-arrow-left" /></button>评测详情</h2></div><div class="page-meta-right"><span class="detail-id-label">#{{ sub.id }}</span></div></div></BaseCard>
    <BaseCard flush class="submission-detail"><div class="detail-header"><h3><i :class="['fas', ...statusConfig(sub.status)[0].split(' ')]" :style="{ color: statusConfig(sub.status)[2] }" />{{ statusConfig(sub.status)[1] }}</h3><span class="detail-time">{{ formatTime(sub.timestamp) }}</span></div>
      <div class="detail-meta"><span><i class="fas fa-book" />题目: <RouterLink :to="`/problem/${sub.problemId}`">{{ sub.problemId }} {{ sub.problemTitle }}</RouterLink></span><span><i class="fas fa-code" />语言: {{ sub.language }}</span><span v-if="sub.timeLimit !== undefined"><i class="fas fa-stopwatch" />时间限制: {{ sub.timeLimit }} ms / 测试点</span><span><i :class="['fas', ...statusConfig(sub.status)[0].split(' ')]" :style="{ color: statusConfig(sub.status)[2] }" />状态: {{ statusConfig(sub.status)[1] }}</span><span v-if="sub.similarity !== undefined && sub.similarity < .5 && sub.similarity > 0"><i class="fas fa-chart-line" />相似度: {{ (sub.similarity * 100).toFixed(0) }}%</span></div>
      <div v-if="sub.totalTests !== undefined" class="detail-summary"><i :class="['fas', sub.status === 'running' ? 'fa-spinner fa-spin' : sub.status === 'ac' ? 'fa-check-circle' : sub.status === 'tle' ? 'fa-clock' : 'fa-times-circle']" :style="{ color: statusConfig(sub.status)[2] }" />已通过 <strong>{{ sub.passedTests }}</strong> / {{ sub.totalTests }} 个测试点</div>
      <div v-if="sub.testResults?.length" class="detail-tc-table-wrap"><details v-for="(tc, index) in sub.testResults" :key="index" :class="['tc-item', `tc-${tc.status || (tc.passed ? 'passed' : 'failed')}`]"><summary class="tc-summary"><span class="tc-summary-title">测试点 {{ index + 1 }}</span><span class="tc-summary-time"><i class="fas fa-stopwatch" />{{ formatDuration(tc.durationMs) }}</span><span :class="testConfig(tc).statusClass"><i :class="['fas', ...testConfig(tc).icon.split(' ')]" />{{ testConfig(tc).label }}</span><i class="fas fa-chevron-down tc-expand-icon" /></summary><div class="tc-content"><div v-for="item in [['输入', tc.input || '(空)'], ['标准输出', tc.expected || '(空)'], ['你的程序输出', tc.actual || (tc.status === 'skipped' ? '未运行' : '(空)')]]" :key="item[0]" class="tc-output-block"><span class="tc-output-label">{{ item[0] }}</span><pre><code>{{ item[1] }}</code></pre></div></div></details></div>
      <div v-if="sub.output && sub.status !== 'ac' && !sub.testResults" class="detail-output"><div class="detail-output-header"><i class="fas fa-terminal" />程序输出</div><pre class="detail-output-content"><code>{{ sub.output }}</code></pre></div>
      <div class="detail-code"><div class="detail-code-header"><i class="fas fa-file-code" />提交代码</div><pre><code>{{ sub.code }}</code></pre></div>
    </BaseCard>
  </div>
</template>
