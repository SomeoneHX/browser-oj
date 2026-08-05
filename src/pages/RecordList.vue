<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSubmissions } from '../composables/useSubmissions'
import BaseCard from '../components/BaseCard.vue'
import { LANGUAGE_LABELS } from '../utils/languages'
import type { Submission, SubmissionStatus } from '../types'

const route = useRoute()
const { submissions } = useSubmissions()
const problemFilter = ref('')
const filteredSubmissions = computed(() => {
  const filter = problemFilter.value.trim().toLowerCase()
  return filter ? submissions.value.filter((submission) => submission.problemId.toLowerCase().includes(filter)) : submissions.value
})

watch(
  () => route.query.problem,
  (problemId) => { problemFilter.value = typeof problemId === 'string' ? problemId : '' },
  { immediate: true },
)

const formatTime = (ts: number) => { const d = new Date(ts); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
const STATUS_VIEW: Record<SubmissionStatus, [string, string, string]> = {
  compiling: ['fa-cog fa-spin', '编译中', 'status-running'],
  running: ['fa-spinner fa-spin', '评测中', 'status-running'],
  tle: ['fa-clock', '超时', 'status-tle'],
  error: ['fa-exclamation-circle', '运行错误', 'status-tle'],
  ac: ['fa-check-circle', '通过', 'status-ac'],
  wa: ['fa-times-circle', '未通过', 'status-wa'],
}
const displayStatus = (sub: Submission) => STATUS_VIEW[sub.status]
const languageLabel = (id: Submission['language']) => LANGUAGE_LABELS[id] || id
</script>

<template>
  <div class="page-container"><BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><h2><i class="fas fa-history" />评测记录</h2></div><div class="page-meta-right"><span v-if="submissions.length" class="problem-count">共 {{ filteredSubmissions.length }} 条</span></div></div><div class="record-filter"><label for="record-problem-filter"><i class="fas fa-filter" />筛选题目编号</label><input id="record-problem-filter" v-model="problemFilter" type="search" placeholder="例如 P1001" /></div></BaseCard>
    <div v-if="!submissions.length" class="empty-state"><i class="fas fa-inbox" /><p>暂无提交记录</p><RouterLink to="/problems" class="btn-back"><i class="fas fa-arrow-left" />去答题</RouterLink></div>
    <div v-else-if="!filteredSubmissions.length" class="empty-state"><i class="fas fa-search" /><p>未找到匹配的评测记录</p></div>
    <BaseCard v-else flush><table class="submission-table"><thead><tr><th class="col-time">时间</th><th class="col-problem">题目</th><th class="col-lang">语言</th><th class="col-status-text">状态</th><th class="col-action">详情</th></tr></thead><tbody><tr v-for="sub in filteredSubmissions" :key="sub.id"><td class="col-time">{{ formatTime(sub.timestamp) }}</td><td class="col-problem"><RouterLink :to="`/problem/${sub.problemId}`">{{ sub.problemId }} {{ sub.problemTitle }}</RouterLink></td><td class="col-lang">{{ languageLabel(sub.language) }}</td><td class="col-status-text"><span :class="['status-badge', displayStatus(sub)[2]]"><i :class="['fas', ...displayStatus(sub)[0].split(' ')]" />{{ displayStatus(sub)[1] }}</span></td><td class="col-action"><RouterLink :to="`/record/${sub.id}`" class="btn-detail"><i class="fas fa-chevron-right" /></RouterLink></td></tr>    </tbody></table></BaseCard>
  </div>
</template>
