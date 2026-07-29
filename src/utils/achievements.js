import { problems } from '../data/problems'

export const ACHIEVEMENT_DEFS = [
  {
    id: 'first_submit',
    title: '初来乍到',
    description: '完成第一次提交',
    icon: 'rocket',
    color: '#52c41a',
  },
  {
    id: 'five_ac',
    title: '连胜五场',
    description: '连续 5 次 Accepted',
    icon: 'trophy',
    color: '#faad14',
  },
  {
    id: 'first_cheat',
    title: '作弊者',
    description: '首次触发反作弊机制',
    icon: 'shield-alt',
    color: '#f5222d',
  },
  {
    id: 'all_cheat',
    title: '明知故犯',
    description: '在所有题目中都触发过作弊',
    icon: 'exclamation-triangle',
    color: '#f5222d',
  },
  {
    id: 'see_through',
    title: '看穿一切',
    description: '在注释中写入陷阱变量名，表明人类识破机制',
    icon: 'eye',
    color: '#722ed1',
  },
]

export function checkAchievements(stats) {
  const unlocked = []

  if (stats.totalSubmissions >= 1) {
    unlocked.push('first_submit')
  }
  if (stats.longestACStreak >= 5) {
    unlocked.push('five_ac')
  }
  if (stats.cheatingCount >= 1) {
    unlocked.push('first_cheat')
  }
  const allProblemIds = problems.map((p) => p.id).sort()
  const cheatedIds = [...new Set(stats.cheatedProblems || [])].sort()
  if (allProblemIds.every((id) => cheatedIds.includes(id))) {
    unlocked.push('all_cheat')
  }
  if ((stats.commentedTrapCount || 0) >= 1) {
    unlocked.push('see_through')
  }

  return unlocked
}
