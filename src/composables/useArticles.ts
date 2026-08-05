import { computed } from 'vue'
import { articles } from '../utils/articleLoader'
import type { Article, ArticleCategory } from '../types'

export interface ArticleCategoryInfo {
  key: ArticleCategory
  label: string
  icon: string
}

export const ARTICLE_CATEGORIES: ArticleCategoryInfo[] = [
  { key: 'solutions', label: '题解', icon: 'fa-pen-nib' },
  { key: 'tech-engineering', label: '科技·工程', icon: 'fa-microchip' },
  { key: 'algo-theory', label: '算法·理论', icon: 'fa-brain' },
  { key: 'life-travel', label: '生活·游记', icon: 'fa-plane' },
  { key: 'academics', label: '学习·文化课', icon: 'fa-book' },
  { key: 'entertainment', label: '休闲·娱乐', icon: 'fa-gamepad' },
]

export function categoryLabel(category: ArticleCategory): string {
  return ARTICLE_CATEGORIES.find((item) => item.key === category)?.label || category
}

export function categoryIcon(category: ArticleCategory): string {
  return ARTICLE_CATEGORIES.find((item) => item.key === category)?.icon || 'fa-file-alt'
}

export function useArticles() {
  const getById = (id: string): Article | null => articles.find((article) => article.id === id) || null
  const all = computed(() => articles)
  const byCategory = (category: ArticleCategory): Article[] => articles.filter((article) => article.category === category)
  const byProblem = (problemId: string): Article[] =>
    articles.filter((article) => article.category === 'solutions' && article.problemId === problemId)

  return { getById, all, byCategory, byProblem }
}
