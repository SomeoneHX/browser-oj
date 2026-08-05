<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProblems } from '../composables/useProblems'
import BaseCard from '../components/BaseCard.vue'

const { all: problems, statsFor } = useProblems()
const problemFilter = ref('')
const filteredProblems = computed(() => {
  const filter = problemFilter.value.trim().toLowerCase()
  if (!filter) return problems.value
  return problems.value.filter((problem) =>
    [problem.id, problem.title, problem.difficulty, ...problem.tags].some((value) => value.toLowerCase().includes(filter)),
  )
})
const difficultyMap: Record<string, string> = { 简单: 'tag-easy', 中等: 'tag-medium', 困难: 'tag-hard' }
const row = (id: string) => {
  const stats = statsFor(id)
  return {
    passRateText: stats.passRate === null ? '-' : `${stats.passRate.toFixed(0)}%`,
    status: stats.status,
    isAc: stats.status === 'ac',
  }
}
</script>

<template>
  <div class="page-container"><BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><h2><i class="fas fa-list" />题目列表</h2></div><div class="page-meta-right"><span class="problem-count">共 {{ filteredProblems.length }} 题</span></div></div><div class="record-filter"><label for="problem-filter"><i class="fas fa-filter" />筛选题目</label><input id="problem-filter" v-model="problemFilter" type="search" placeholder="题目编号、名称或标签" /></div></BaseCard>
    <div v-if="!filteredProblems.length" class="empty-state"><i class="fas fa-search" /><p>未找到匹配的题目</p></div>
    <BaseCard v-else flush><table class="problem-table"><thead><tr><th class="col-id">#</th><th class="col-title">题目名称</th><th class="col-diff">难度</th><th class="col-tags">标签</th><th class="col-rate">通过率</th><th class="col-status">我的状态</th></tr></thead><tbody>
      <tr v-for="problem in filteredProblems" :key="problem.id"><td class="col-id"><RouterLink :to="`/problem/${problem.id}`" class="problem-link">{{ problem.id }}</RouterLink></td><td class="col-title"><RouterLink :to="`/problem/${problem.id}`" class="problem-link">{{ problem.title }}</RouterLink></td><td class="col-diff"><span :class="['tag', difficultyMap[problem.difficulty] || '']">{{ problem.difficulty }}</span></td><td class="col-tags"><div class="problem-list-tags"><span v-for="tag in problem.tags" :key="tag" class="problem-tag">{{ tag }}</span></div></td><td class="col-rate">{{ row(problem.id).passRateText }}</td><td class="col-status"><span v-if="row(problem.id).status" :class="['status-badge', row(problem.id).isAc ? 'status-ac' : 'status-wa']"><i :class="['fas', row(problem.id).isAc ? 'fa-check-circle' : 'fa-times-circle']" />{{ row(problem.id).isAc ? '通过' : '未通过' }}</span><span v-else class="status-none">-</span></td></tr>
    </tbody></table></BaseCard>
  </div>
</template>
