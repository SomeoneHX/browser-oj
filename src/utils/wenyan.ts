import { normalize } from './judge'
import { updateSubmission } from './storage'
import type { Problem, RunOutput, Submission, TestResult } from '../types'

function runWenyanCase(code: string, timeLimit: number): Promise<RunOutput> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/wenyan.worker.ts', import.meta.url), { type: 'module' })
    const startedAt = performance.now()
    let settled = false
    const finish = (result: RunOutput) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker.terminate()
      resolve(result)
    }
    const timer = setTimeout(() => finish({ output: '运行超时', error: true, timeout: true, durationMs: timeLimit }), timeLimit)
    worker.onmessage = (event: MessageEvent<{ output: string; error?: string }>) => {
      finish({ output: event.data.error || event.data.output, error: !!event.data.error, durationMs: performance.now() - startedAt })
    }
    worker.onerror = (event) => finish({ output: event.message || 'Wenyan Worker 运行错误', error: true, durationMs: performance.now() - startedAt })
    worker.postMessage({ code })
  })
}

export function runWenyan(code: string, timeLimit: number) {
  return runWenyanCase(code, timeLimit)
}

export async function runWenyanJudge(submission: Submission, problem: Problem) {
  const testCases = problem.testCases || []
  const results: TestResult[] = testCases.map((testCase) => ({ input: testCase.input, expected: testCase.output, actual: null, status: 'pending', passed: false, error: false, durationMs: null }))
  updateSubmission(submission.id, { status: 'running', testResults: results, passedTests: 0 })
  for (let index = 0; index < testCases.length; index += 1) {
    results[index] = { ...results[index], status: 'running' }
    updateSubmission(submission.id, { testResults: [...results] })
    const result = await runWenyanCase(submission.code, problem.timeLimit)
    const passed = !result.error && normalize(result.output) === normalize(testCases[index].output)
    results[index] = { ...results[index], actual: result.output, passed, error: result.error, timeout: result.timeout, durationMs: result.durationMs, status: result.timeout ? 'timeout' : result.error ? 'error' : passed ? 'passed' : 'failed' }
    if (result.error) {
      for (let rest = index + 1; rest < results.length; rest += 1) results[rest] = { ...results[rest], status: 'skipped', actual: '未运行' }
    }
    updateSubmission(submission.id, { testResults: [...results], passedTests: results.filter((item) => item.passed).length })
    if (result.error) break
  }
  const passedTests = results.filter((item) => item.passed).length
  const hasTimeout = results.some((item) => item.timeout)
  const hasError = results.some((item) => item.error && !item.timeout)
  updateSubmission(submission.id, { status: hasTimeout ? 'tle' : hasError ? 'error' : passedTests === testCases.length ? 'ac' : 'wa', passedTests, totalTests: testCases.length, output: results.find((item) => !item.passed)?.actual || null, similarity: testCases.length ? passedTests / testCases.length : 0 })
}
