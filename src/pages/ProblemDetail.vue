<script setup>
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

const route = useRoute()
const router = useRouter()
const { getById } = useProblems()
const { latestForProblem } = useSubmissions(computed(() => route.params.problemId))
const { copied, copy } = useClipboard()
const problem = computed(() => getById(route.params.problemId))
const code = ref('')
const language = ref('cpp')
let loadedProblemId

const loadLastSubmission = () => {
  if (loadedProblemId === route.params.problemId) return
  loadedProblemId = route.params.problemId
  code.value = latestForProblem.value?.code || ''
  language.value = latestForProblem.value?.language || 'cpp'
}
loadLastSubmission()
watch(() => route.params.problemId, loadLastSubmission)

async function submit() {
  const currentProblem = problem.value
  if (!code.value.trim() || !currentProblem) return
  const submission = addSubmission({ problemId: currentProblem.id, problemTitle: currentProblem.title, code: code.value, language: language.value, status: 'running', timeLimit: currentProblem.timeLimit, testResults: currentProblem.testCases.map((testCase) => ({ input: testCase.input, expected: testCase.output, actual: null, passed: false, status: 'pending', durationMs: null })), passedTests: 0, totalTests: currentProblem.testCases.length })
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
