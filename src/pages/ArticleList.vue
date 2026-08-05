<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import ArticleCard from '../components/ArticleCard.vue'
import { ARTICLE_CATEGORIES, useArticles } from '../composables/useArticles'
import { useProblems } from '../composables/useProblems'
import type { ArticleCategory } from '../types'

const route = useRoute()
const router = useRouter()
const { all, byCategory, byProblem } = useArticles()
const { getById } = useProblems()

const categoryParam = computed(() => route.query.category)
const activeCategory = computed<ArticleCategory | null>(() => {
  const value = categoryParam.value
  if (typeof value !== 'string') return null
  return ARTICLE_CATEGORIES.some((item) => item.key === value) ? (value as ArticleCategory) : null
})
const problemId = computed(() => (typeof route.query.problem === 'string' ? route.query.problem : null))
const problem = computed(() => (problemId.value ? getById(problemId.value) : null))

const articles = computed(() => {
  if (problemId.value) return byProblem(problemId.value)
  if (activeCategory.value) return byCategory(activeCategory.value)
  return all.value
})
const countFor = (key: ArticleCategory) => byCategory(key).length

const clearFilter = () => router.push('/article')
</script>

<template>
  <div class="page-container">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left">
          <h2><i class="fas fa-newspaper" />文章</h2>
          <span v-if="problem" class="tag article-problem-tag"><i class="fas fa-code" />{{ problem.id }} · {{ problem.title }} 的题解</span>
          <span v-else-if="activeCategory" class="tag article-cat-tag"><i :class="['fas', ARTICLE_CATEGORIES.find((item) => item.key === activeCategory)?.icon]" />{{ ARTICLE_CATEGORIES.find((item) => item.key === activeCategory)?.label }}</span>
        </div>
        <div class="page-meta-right">
          <span class="problem-count">共 {{ articles.length }} 篇</span>
          <button v-if="problemId" class="btn-copy" @click="clearFilter"><i class="fas fa-times" />清除筛选</button>
        </div>
      </div>
    </BaseCard>

    <div class="article-layout">
      <div class="article-categories-wrap">
        <BaseCard padding="sm" class="article-categories-card">
          <nav class="article-category-list" aria-label="文章分类">
            <RouterLink to="/article" class="article-category-item" :class="{ active: !activeCategory && !problemId }">
              <i class="fas fa-th-large" /><span>全部</span><span class="article-category-count">{{ all.length }}</span>
            </RouterLink>
            <RouterLink
              v-for="item in ARTICLE_CATEGORIES"
              :key="item.key"
              :to="{ path: '/article', query: { category: item.key } }"
              class="article-category-item"
              :class="{ active: activeCategory === item.key && !problemId }"
            >
              <i :class="['fas', item.icon]" /><span>{{ item.label }}</span><span class="article-category-count">{{ countFor(item.key) }}</span>
            </RouterLink>
          </nav>
        </BaseCard>
      </div>

      <div class="article-grid-wrap">
        <div v-if="articles.length" class="article-grid">
          <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
        </div>
        <BaseCard v-else padding="lg" class="empty-state">
          <i class="fas fa-file-alt" />
          <p>该分类下暂无文章</p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
