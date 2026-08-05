<script setup lang="ts">
import { useProblems } from '../composables/useProblems'
import { categoryIcon, categoryLabel } from '../composables/useArticles'
import type { Article } from '../types'

const props = defineProps<{ article: Article }>()
const { getById } = useProblems()
const problem = props.article.problemId ? getById(props.article.problemId) : null
</script>

<template>
  <div class="article-card">
    <div class="article-card-head">
      <span class="tag article-cat-tag"><i :class="['fas', categoryIcon(article.category)]" />{{ categoryLabel(article.category) }}</span>
      <span class="article-card-head-right">
        <RouterLink v-if="problem" :to="`/problem/${problem.id}`" class="article-problem-chip">
          <i class="fas fa-code" /><span class="article-problem-id">{{ problem.id }}</span><span class="article-problem-name">{{ problem.title }}</span>
        </RouterLink>
        <span v-if="article.tags.length" class="article-card-tags">
          <span v-for="tag in article.tags" :key="tag" class="article-card-tag">{{ tag }}</span>
        </span>
      </span>
    </div>
    <RouterLink :to="`/article/${article.id}`" class="article-card-title">{{ article.title }}</RouterLink>
    <p class="article-card-summary">{{ article.summary }}</p>
    <div class="article-card-meta">
      <span><i class="fas fa-calendar-alt" />{{ article.date }}</span>
      <span><i class="fas fa-user" />{{ article.author }}</span>
      <RouterLink v-if="article.problemId" :to="`/article?problem=${article.problemId}`" class="article-solutions-link"><i class="fas fa-layer-group" />该题所有题解</RouterLink>
    </div>
  </div>
</template>
