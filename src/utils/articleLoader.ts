import type { Article, ArticleCategory } from '../types'

const CATEGORIES: ArticleCategory[] = ['solutions', 'tech-engineering', 'algo-theory', 'life-travel', 'academics', 'entertainment']

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .replace(/^\[|\]$/g, '')
    .split(/[,，]/)
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

function makeExcerpt(content: string): string {
  const plain = content.replace(/\s+/g, ' ').trim()
  return plain.length > 180 ? plain.slice(0, 180) + '…' : plain
}

function loadArticles(): Article[] {
  const mdModules = import.meta.glob<string>('/articles/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  })

  const articles: Article[] = []
  for (const key of Object.keys(mdModules)) {
    const match = key.match(/\/articles\/([^/]+)\.md$/)
    if (!match) continue
    const id = match[1]
    const source = mdModules[key] || ''
    const frontMatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
    const metadata = frontMatterMatch?.[1] || ''
    const content = frontMatterMatch?.[2]?.trim() || source

    const rawCategory = metadata.match(/^category:\s*(.+)$/m)?.[1]?.trim() || ''
    const category = CATEGORIES.includes(rawCategory as ArticleCategory)
      ? (rawCategory as ArticleCategory)
      : 'tech-engineering'

    articles.push({
      id,
      title: metadata.match(/^title:\s*(.+)$/m)?.[1]?.trim() || id,
      category,
      date: metadata.match(/^date:\s*(.+)$/m)?.[1]?.trim() || '',
      author: metadata.match(/^author:\s*(.+)$/m)?.[1]?.trim() || '',
      tags: parseList(metadata.match(/^tags:\s*(.+)$/m)?.[1]),
      problemId: metadata.match(/^problem:\s*(.+)$/m)?.[1]?.trim() || undefined,
      summary: metadata.match(/^summary:\s*(.+)$/m)?.[1]?.trim() || makeExcerpt(content),
      content,
    })
  }

  articles.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
  return articles
}

export const articles = loadArticles()
