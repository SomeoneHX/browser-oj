import { updateSubmission } from './storage'
import { runWasmJudge } from './emception'
import { WASM_LANGUAGE } from './languages'
import type { JudgeCaseResult, Problem, Submission, TestResult, WorkerRequest, WorkerResponse } from '../types'

function createWorker(): Worker {
  return new Worker(new URL('../workers/judge.worker.ts', import.meta.url), { type: 'module' })
}

function runTestCase(worker: Worker, payload: WorkerRequest, timeLimit: number): Promise<JudgeCaseResult & { durationMs: number }> {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    const timer = setTimeout(() => {
      worker.terminate()
      resolve({
        input: payload.testCase.input,
        expected: payload.testCase.output,
        actual: '运行超时',
        passed: false,
        error: true,
        timeout: true,
        durationMs: timeLimit,
      })
    }, timeLimit)

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timer)
      const durationMs = performance.now() - startedAt
      if (event.data.type === 'error') {
        resolve({
          input: payload.testCase.input,
          expected: payload.testCase.output,
          actual: event.data.error,
          passed: false,
          error: true,
          durationMs,
        })
        return
      }
      resolve({ ...event.data.result, durationMs })
    }
    worker.onerror = (event) => {
      clearTimeout(timer)
      resolve({
        input: payload.testCase.input,
        expected: payload.testCase.output,
        actual: event.message || '判题 Worker 运行错误',
        passed: false,
        error: true,
        durationMs: performance.now() - startedAt,
      })
    }
    worker.postMessage(payload)
  })
}

export async function startJudge(submission: Submission, problem: Problem | null) {
  if (!submission || !problem) {
    if (submission?.id) {
      updateSubmission(submission.id, {
        status: 'error',
        output: '判题题目不存在',
      })
    }
    return
  }

  if (submission.language === WASM_LANGUAGE) {
    await runWasmJudge(submission, problem)
    return
  }

  const testCases = problem.testCases || []
  const results: TestResult[] = testCases.map((testCase) => ({
    input: testCase.input,
    expected: testCase.output,
    actual: null,
    status: 'pending',
    passed: false,
    error: false,
    durationMs: null,
  }))
  updateSubmission(submission.id, { status: 'running', testResults: results, passedTests: 0 })

  try {
    for (let index = 0; index < testCases.length; index += 1) {
      results[index] = { ...results[index], status: 'running' }
      updateSubmission(submission.id, { testResults: [...results] })

      const worker = createWorker()
      const result = await runTestCase(worker, {
        code: submission.code,
        language: submission.language,
        testCase: testCases[index],
      }, problem.timeLimit)
      worker.terminate()
      results[index] = {
        ...results[index],
        ...result,
        status: result.timeout ? 'timeout' : result.error ? 'error' : result.passed ? 'passed' : 'failed',
      }
      const passedTests = results.filter((test) => test.passed).length
      if (result.error) {
        for (let skippedIndex = index + 1; skippedIndex < results.length; skippedIndex += 1) {
          results[skippedIndex] = {
            ...results[skippedIndex],
            status: 'skipped',
            actual: '未运行',
          }
        }
      }
      updateSubmission(submission.id, { testResults: [...results], passedTests })
      if (result.error) break
    }

    const passedTests = results.filter((test) => test.passed).length
    const hasTimeout = results.some((test) => test.timeout)
    const hasError = results.some((test) => test.error && !test.timeout)
    const status = hasTimeout ? 'tle' : hasError ? 'error' : passedTests !== testCases.length ? 'wa' : 'ac'
    updateSubmission(submission.id, {
      status,
      passedTests,
      totalTests: testCases.length,
      output: results.find((test) => !test.passed)?.actual || null,
      similarity: testCases.length ? passedTests / testCases.length : 0,
    })
  } catch (error) {
    updateSubmission(submission.id, {
      status: 'error',
      output: (error as Error)?.message || '判题任务启动失败',
      testResults: [...results],
    })
  }
}
