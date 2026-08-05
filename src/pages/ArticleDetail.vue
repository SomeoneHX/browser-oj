<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import { categoryIcon, categoryLabel, useArticles } from '../composables/useArticles'
import { useProblems } from '../composables/useProblems'

const route = useRoute()
const router = useRouter()
const { getById } = useArticles()
const { getById: getProblemById } = useProblems()
const article = computed(() => getById(String(route.params.id)))
const problem = computed(() => (article.value?.problemId ? getProblemById(article.value.problemId) : null))
const md = new MarkdownIt({ html: false, linkify: true, typographer: true }).use(taskLists)
const html = computed(() => (article.value ? md.render(article.value.content) : ''))
</script>

<template>
  <div v-if="!article" class="page-container">
    <div class="not-found">
      <i class="fas fa-question-circle" />
      <h2>文章不存在</h2>
      <RouterLink to="/article" class="btn-back"><i class="fas fa-arrow-left" />返回文章列表</RouterLink>
    </div>
  </div>
  <div v-else class="page-container">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left">
          <button class="header-back-link" title="返回文章列表" @click="router.push('/article')"><i class="fas fa-arrow-left" /></button>
          <span :class="['tag', 'article-cat-tag']"><i :class="['fas', categoryIcon(article.category)]" />{{ categoryLabel(article.category) }}</span>
          <h2>{{ article.title }}</h2>
        </div>
        <div class="page-meta-right">
          <span class="problem-time-limit"><i class="fas fa-user" />{{ article.author }} · <i class="fas fa-calendar-alt" />{{ article.date }}</span>
        </div>
      </div>
      <div v-if="problem" class="article-related-problem">
        <RouterLink :to="`/problem/${problem.id}`" class="article-problem-chip">
          <i class="fas fa-code" /><span class="article-problem-id">{{ problem.id }}</span><span class="article-problem-name">{{ problem.title }}</span>
        </RouterLink>
        <RouterLink :to="`/article?problem=${problem.id}`" class="article-solutions-link"><i class="fas fa-layer-group" />该题所有题解</RouterLink>
      </div>
      <div v-if="article.tags.length" class="article-detail-tags">
        <span v-for="tag in article.tags" :key="tag" class="article-card-tag">{{ tag }}</span>
      </div>
    </BaseCard>
    <BaseCard padding="lg" class="article-content">
      <div class="article-content-body" v-html="html" />
    </BaseCard>
  </div>
</template>
