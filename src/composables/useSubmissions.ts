import { computed, onBeforeUnmount, onMounted, ref, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { getSubmission, getSubmissions } from '../utils/storage'

export function useSubmissions(problemId?: MaybeRef<string | undefined>) {
  const version = ref(0)
  const refresh = () => { version.value += 1 }

  onMounted(() => window.addEventListener('submission-updated', refresh))
  onBeforeUnmount(() => window.removeEventListener('submission-updated', refresh))

  const submissions = computed(() => {
    version.value
    return getSubmissions()
  })
  const forProblem = computed(() => submissions.value.filter((submission) => submission.problemId === (problemId ? toValue(problemId) : undefined)))

  return {
    submissions,
    forProblem,
    latestForProblem: computed(() => forProblem.value[0] || null),
    getById: (id: string) => {
      version.value
      return getSubmission(id)
    },
  }
}
