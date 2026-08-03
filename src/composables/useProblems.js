import { computed } from 'vue'
import { problems } from '../data/problems'
import { useSubmissions } from './useSubmissions'

export function useProblems() {
  const { submissions } = useSubmissions()
  const getById = (id) => problems.find((problem) => problem.id === id) || null
  const statsFor = (problemId) => {
    const own = submissions.value.filter((submission) => submission.problemId === problemId)
    if (!own.length) return { passRate: null, status: null }
    return {
      passRate: own.filter((submission) => submission.status === 'ac').length / own.length * 100,
      status: own[0].status,
    }
  }

  return { problems, getById, statsFor, all: computed(() => problems) }
}
