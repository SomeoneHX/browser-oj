<script setup>
import { useSubmissions } from '../composables/useSubmissions'
const { submissions } = useSubmissions()
const formatTime = (ts) => { const d = new Date(ts); const pad = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` }
const displayStatus = (sub) => ({ running: ['fa-spinner fa-spin', '评测中', 'status-running'], tle: ['fa-clock', '超时', 'status-tle'], error: ['fa-exclamation-circle', '运行错误', 'status-tle'], ac: ['fa-check-circle', '通过', 'status-ac'] }[sub.status] || ['fa-times-circle', '未通过', 'status-wa'])
</script>

<template>
  <div class="page-container"><div class="page-header"><h2><i class="fas fa-history" />评测记录</h2><span v-if="submissions.length" class="problem-count">共 {{ submissions.length }} 条</span></div>
    <div v-if="!submissions.length" class="empty-state"><i class="fas fa-inbox" /><p>暂无提交记录</p><RouterLink to="/problems" class="btn-back"><i class="fas fa-arrow-left" />去答题</RouterLink></div>
    <div v-else class="table-wrapper"><table class="submission-table"><thead><tr><th class="col-time">时间</th><th class="col-problem">题目</th><th class="col-lang">语言</th><th class="col-status-text">状态</th><th class="col-action">详情</th></tr></thead><tbody><tr v-for="sub in submissions" :key="sub.id"><td class="col-time">{{ formatTime(sub.timestamp) }}</td><td class="col-problem"><RouterLink :to="`/problem/${sub.problemId}`">{{ sub.problemId }} {{ sub.problemTitle }}</RouterLink></td><td class="col-lang">{{ sub.language }}</td><td class="col-status-text"><span :class="['status-badge', displayStatus(sub)[2]]"><i :class="['fas', ...displayStatus(sub)[0].split(' ')]" />{{ displayStatus(sub)[1] }}</span></td><td class="col-action"><RouterLink :to="`/record/${sub.id}`" class="btn-detail"><i class="fas fa-chevron-right" /></RouterLink></td></tr></tbody></table></div>
  </div>
</template>
