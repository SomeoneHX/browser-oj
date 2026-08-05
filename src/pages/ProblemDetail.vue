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
const { forProblem, latestForProblem } = useSubmissions(problemId)
const { copied, copy } = useClipboard()
const problem = computed(() => getById(problemId.value))
const code = ref('')
const language = ref<LanguageId>('cpp')
const showEditor = ref(false)
let loadedProblemId: string | undefined

const submissionCount = computed(() => forProblem.value.length)
const acceptedCount = computed(() => forProblem.value.filter((submission) => submission.status === 'ac').length)
const bestScore = computed(() => {
  const scores = forProblem.value
    .filter((submission) => (submission.totalTests || 0) > 0)
    .map((submission) => Math.round(((submission.passedTests || 0) / (submission.totalTests || 1)) * 100))

  return scores.length > 0 ? Math.max(...scores) : null
})

const loadLastSubmission = () => {
  if (loadedProblemId === problemId.value) return
  loadedProblemId = problemId.value
  showEditor.value = false
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
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left">
          <span class="problem-id">{{ problem.id }}</span>
          <h2>{{ problem.title }}</h2>
          <span :class="['tag', problem.difficulty === '简单' ? 'tag-easy' : problem.difficulty === '中等' ? 'tag-medium' : 'tag-hard']">{{ problem.difficulty }}</span>
        </div>
        <div class="page-meta-right">
          <div class="problem-submission-stats">
            <span><i class="fas fa-paper-plane" />提交 {{ submissionCount }}</span>
            <span><i class="fas fa-check-circle" />通过 {{ acceptedCount }}</span>
          </div>
          <span class="problem-time-limit"><i class="fas fa-stopwatch" />{{ problem.timeLimit }} ms / 测试点</span>
        </div>
      </div>
      <div class="problem-detail-tabs" role="tablist" aria-label="题目视图">
        <button :class="['problem-detail-tab', { active: !showEditor }]" role="tab" :aria-selected="!showEditor" @click="showEditor = false"><i class="fas fa-book-open" />题目描述</button>
        <button :class="['problem-detail-tab', { active: showEditor }]" role="tab" :aria-selected="showEditor" @click="showEditor = true"><i class="fas fa-code" />提交答案</button>
      </div>
    </BaseCard>
    <div class="problem-layout">
      <div class="problem-left">
        <ProblemRenderer v-if="!showEditor" :description="problem.description">
          <template #actions>
            <button class="btn-copy" @click="copy(problem.description)"><i :class="['fas', copied ? 'fa-check' : 'fa-clipboard']" />{{ copied ? '已复制' : '复制题目' }}</button>
          </template>
        </ProblemRenderer>
        <template v-else>
          <CodeEditor :value="code" :language="language" @update:value="code = $event" @update:language="language = $event" />
          <button class="btn-submit" :disabled="!code.trim()" @click="submit"><i class="fas fa-paper-plane" />提交评测</button>
        </template>
      </div>
      <div class="problem-side-cards">
        <BaseCard padding="md" class="problem-side-card">
          <h3 class="problem-side-card-title">题目信息</h3>
          <div class="problem-info-list">
            <div class="problem-info-item"><span>题目编号</span><strong>{{ problem.id }}</strong></div>
            <div class="problem-info-item"><span>难度</span><span :class="['tag', problem.difficulty === '简单' ? 'tag-easy' : problem.difficulty === '中等' ? 'tag-medium' : 'tag-hard']">{{ problem.difficulty }}</span></div>
            <div class="problem-info-item"><span>历史最高分</span><strong v-if="bestScore !== null" :class="bestScore >= 60 ? 'score-high' : 'score-low'">{{ bestScore }} 分</strong><strong v-else class="score-empty">暂无记录</strong></div>
          </div>
          <div class="problem-info-links">
            <RouterLink :to="{ path: '/article', query: { problem: problem.id } }" class="problem-info-link"><i class="fas fa-book-open" />查看题解</RouterLink>
            <RouterLink :to="{ path: '/record', query: { problem: problem.id } }" class="problem-info-link"><i class="fas fa-history" />提交记录</RouterLink>
            <RouterLink :to="`/discuss/${problem.id}`" class="problem-info-link"><i class="fas fa-comments" />讨论区</RouterLink>
          </div>
        </BaseCard>
        <BaseCard padding="md" class="problem-side-card">
          <h3 class="problem-side-card-title">标签</h3>
          <div v-if="problem.tags.length" class="problem-tags"><span v-for="tag in problem.tags" :key="tag" class="problem-tag">{{ tag }}</span></div>
          <p v-else class="problem-tags-empty">暂无标签</p>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
