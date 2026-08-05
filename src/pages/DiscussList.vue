<script setup lang="ts">
import BaseCard from '../components/BaseCard.vue'
import { useProblems } from '../composables/useProblems'

const { all: problems } = useProblems()
const difficultyMap: Record<string, string> = { 简单: 'tag-easy', 中等: 'tag-medium', 困难: 'tag-hard' }
</script>

<template>
  <div class="page-container">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left"><h2><i class="fas fa-comments" />讨论区</h2></div>
        <div class="page-meta-right"><span class="problem-count">共 {{ problems.length + 1 }} 个讨论区</span></div>
      </div>
    </BaseCard>
    <div class="discuss-list">
      <BaseCard padding="md" class="discuss-list-card">
        <div class="discuss-list-main">
          <RouterLink to="/discuss/feedback" class="discuss-list-title"><i class="fas fa-bullhorn" /><strong>Browser OJ 反馈建议</strong></RouterLink>
          <div class="discuss-list-meta"><span>反馈问题、提出建议，帮助我们改进 Browser OJ。</span></div>
        </div>
        <RouterLink to="/discuss/feedback" class="discuss-enter-link"><i class="fas fa-comment-dots" />提交反馈</RouterLink>
      </BaseCard>
      <BaseCard v-for="problem in problems" :key="problem.id" padding="md" class="discuss-list-card">
        <div class="discuss-list-main">
          <RouterLink :to="`/discuss/${problem.id}`" class="discuss-list-title"><span class="problem-id">{{ problem.id }}</span><strong>{{ problem.title }}</strong></RouterLink>
          <div class="discuss-list-meta"><span :class="['tag', difficultyMap[problem.difficulty] || '']">{{ problem.difficulty }}</span><div class="problem-list-tags"><span v-for="tag in problem.tags" :key="tag" class="problem-tag">{{ tag }}</span></div></div>
        </div>
        <RouterLink :to="`/discuss/${problem.id}`" class="discuss-enter-link"><i class="fas fa-comments" />进入讨论</RouterLink>
      </BaseCard>
    </div>
  </div>
</template>
