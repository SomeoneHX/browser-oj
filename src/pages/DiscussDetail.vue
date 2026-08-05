<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Giscus from '@giscus/vue'
import BaseCard from '../components/BaseCard.vue'
import { useProblems } from '../composables/useProblems'

const route = useRoute()
const { getById } = useProblems()
const problem = computed(() => getById(String(route.params.id)))
const difficultyMap: Record<string, string> = { 简单: 'tag-easy', 中等: 'tag-medium', 困难: 'tag-hard' }
</script>

<template>
  <div v-if="!problem" class="page-container"><div class="not-found"><i class="fas fa-question-circle" /><h2>题目不存在</h2><RouterLink to="/discuss" class="btn-back"><i class="fas fa-arrow-left" />返回讨论区</RouterLink></div></div>
  <div v-else class="page-container">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left">
          <RouterLink to="/discuss" class="header-back-link" title="返回讨论区"><i class="fas fa-arrow-left" /></RouterLink>
          <span class="problem-id">{{ problem.id }}</span>
          <h2>{{ problem.title }} 讨论区</h2>
          <span :class="['tag', difficultyMap[problem.difficulty] || '']">{{ problem.difficulty }}</span>
        </div>
        <div class="page-meta-right"><RouterLink :to="`/problem/${problem.id}`" class="problem-info-link"><i class="fas fa-code" />查看题目</RouterLink></div>
      </div>
    </BaseCard>
    <div class="discuss-detail-layout">
      <BaseCard padding="md" class="discuss-giscus-card">
        <Giscus
          :key="problem.id"
          repo="SomeoneHX/browser-oj"
          repoId="R_kgDOTqBmow"
          category="Announcements"
          categoryId="DIC_kwDOTqBmo84DCt2A"
          mapping="specific"
          :term="`problem-discuss-${problem.id}`"
          strict="0"
          reactions-enabled="1"
          emit-metadata="0"
          input-position="bottom"
          theme="light"
          lang="zh-CN"
          :lazyLoad="true"
        />
      </BaseCard>
      <BaseCard padding="md" class="discuss-guide-card">
        <h3><i class="fas fa-circle-info" />讨论说明</h3>
        <p>欢迎围绕本题交流解题思路与实现细节。</p>
        <ul>
          <li>题意理解与样例分析</li>
          <li>算法思路和复杂度优化</li>
          <li>边界条件与调试经验</li>
          <li>代码实现问题</li>
        </ul>
        <p class="discuss-guide-note"><i class="fas fa-lightbulb" />请勿直接发布完整题解或答案，给其他同学保留思考空间。</p>
      </BaseCard>
    </div>
  </div>
</template>
