const DEFAULT_TIME_LIMIT_MS = 5000

import { runWasmIde } from './emception'
import { WASM_LANGUAGE } from './languages'
import type { LanguageId, RunOutput, TestCase, WorkerRequest, WorkerResponse } from '../types'

function createWorker(): Worker {
  return new Worker(new URL('../workers/judge.worker.ts', import.meta.url), { type: 'module' })
}

export function runIdeCode(code: string, language: LanguageId, input: string, timeLimit = DEFAULT_TIME_LIMIT_MS): Promise<RunOutput> {
  if (language === WASM_LANGUAGE) return runWasmIde(code, input, timeLimit)
  return new Promise((resolve) => {
    const worker = createWorker()
    const startedAt = performance.now()
    const timer = setTimeout(() => {
      worker.terminate()
      resolve({
        output: '运行超时',
        error: true,
        timeout: true,
        durationMs: timeLimit,
      })
    }, timeLimit)

    const testCase: TestCase = { input, output: '' }
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timer)
      const durationMs = performance.now() - startedAt
      if (event.data.type === 'error') {
        resolve({ output: event.data.error, error: true, durationMs })
        return
      }
      const result = event.data.result
      resolve({
        output: result.actual || '',
        error: result.error,
        durationMs,
      })
    }
    worker.onerror = (event) => {
      clearTimeout(timer)
      resolve({
        output: event.message || 'IDE Worker 运行错误',
        error: true,
        durationMs: performance.now() - startedAt,
      })
    }
    const payload: WorkerRequest = {
      code,
      language,
      testCase,
    }
    worker.postMessage(payload)
  })
}
