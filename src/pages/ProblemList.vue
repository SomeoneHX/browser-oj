<script setup>
import { useProblems } from '../composables/useProblems'
import BaseCard from '../components/BaseCard.vue'
const { all: problems, statsFor } = useProblems()
const difficultyMap = { 简单: 'tag-easy', 中等: 'tag-medium', 困难: 'tag-hard' }
</script>

<template>
  <div class="page-container"><BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><h2><i class="fas fa-list" />题目列表</h2></div><div class="page-meta-right"><span class="problem-count">共 {{ problems.length }} 题</span></div></div></BaseCard>
    <BaseCard flush><table class="problem-table"><thead><tr><th class="col-id">#</th><th class="col-title">题目名称</th><th class="col-diff">难度</th><th class="col-rate">通过率</th><th class="col-status">我的状态</th></tr></thead><tbody>
      <tr v-for="problem in problems" :key="problem.id"><td class="col-id"><RouterLink :to="`/problem/${problem.id}`" class="problem-link">{{ problem.id }}</RouterLink></td><td class="col-title"><RouterLink :to="`/problem/${problem.id}`" class="problem-link">{{ problem.title }}</RouterLink></td><td class="col-diff"><span :class="['tag', difficultyMap[problem.difficulty] || '']">{{ problem.difficulty }}</span></td><td class="col-rate">{{ statsFor(problem.id).passRate === null ? '-' : `${statsFor(problem.id).passRate.toFixed(0)}%` }}</td><td class="col-status"><span v-if="statsFor(problem.id).status" :class="['status-badge', statsFor(problem.id).status === 'ac' ? 'status-ac' : 'status-wa']"><i :class="['fas', statsFor(problem.id).status === 'ac' ? 'fa-check-circle' : 'fa-times-circle']" />{{ statsFor(problem.id).status === 'ac' ? '通过' : '未通过' }}</span><span v-else class="status-none">-</span></td></tr>
    </tbody></table></BaseCard>
  </div>
</template>
