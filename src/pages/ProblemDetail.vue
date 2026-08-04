<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addSubmission } from '../utils/storage'
import { startJudge } from '../utils/judgeManager'
import { useProblems } from '../composables/useProblems'
import { useSubmissions } from '../composables/useSubmissions'
import { useClipboard } from '../composables/useClipboard'
import ProblemRenderer from '../components/ProblemRenderer.vue'
import CodeEditor from '../components/CodeEditor.vue'
import BaseCard from '../components/BaseCard.vue'
import type { LanguageId } from '../types'

const route = useRoute()
const router = useRouter()
const { getById } = useProblems()
const problemId = computed(() => String(route.params.problemId))
const { latestForProblem } = useSubmissions(problemId)
const { copied, copy } = useClipboard()
const problem = computed(() => getById(problemId.value))
const code = ref('')
const language = ref<LanguageId>('cpp')
let loadedProblemId: string | undefined

const loadLastSubmission = () => {
  if (loadedProblemId === problemId.value) return
  loadedProblemId = problemId.value
  code.value = latestForProblem.value?.code || ''
  language.value = latestForProblem.value?.language || 'cpp'
}
loadLastSubmission()
watch(problemId, loadLastSubmission)

async function submit() {
  const currentProblem = problem.value
  if (!code.value.trim() || !currentProblem) return
  const submission = addSubmission({ problemId: currentProblem.id, problemTitle: currentProblem.title, code: code.value, language: language.value, status: 'running', timeLimit: currentProblem.timeLimit, testResults: currentProblem.testCases.map((testCase) => ({ input: testCase.input, expected: testCase.output, actual: null, passed: false, error: false, status: 'pending' as const, durationMs: null })), passedTests: 0, totalTests: currentProblem.testCases.length })
  await router.push(`/record/${submission.id}`)
  void startJudge(submission, currentProblem)
}
</script>

<template>
  <div v-if="!problem" class="page-container"><div class="not-found"><i class="fas fa-question-circle" /><h2>题目不存在</h2><RouterLink to="/problems" class="btn-back"><i class="fas fa-arrow-left" />返回题目列表</RouterLink></div></div>
  <div v-else class="page-container problem-detail-page">
    <BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><span class="problem-id">{{ problem.id }}</span><h2>{{ problem.title }}</h2><span :class="['tag', problem.difficulty === '简单' ? 'tag-easy' : problem.difficulty === '中等' ? 'tag-medium' : 'tag-hard']">{{ problem.difficulty }}</span></div><div class="page-meta-right"><span class="problem-time-limit"><i class="fas fa-stopwatch" />{{ problem.timeLimit }} ms / 测试点</span></div></div></BaseCard>
    <div class="problem-layout"><div class="problem-left"><ProblemRenderer :description="problem.description"><template #actions><button class="btn-copy" @click="copy(problem.description)"><i :class="['fas', copied ? 'fa-check' : 'fa-clipboard']" />{{ copied ? '已复制' : '复制题目' }}</button></template></ProblemRenderer></div><div class="problem-right"><CodeEditor :value="code" :language="language" @update:value="code = $event" @update:language="language = $event" /><button class="btn-submit" :disabled="!code.trim()" @click="submit"><i class="fas fa-paper-plane" />提交评测</button></div></div>
  </div>
</template>
