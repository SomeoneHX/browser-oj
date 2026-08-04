const DEFAULT_TIME_LIMIT_MS = 5000

import { runWasmIde } from './emception'
import { WASM_LANGUAGE } from './languages'

function createWorker() {
  return new Worker(new URL('../workers/judge.worker.js', import.meta.url), { type: 'module' })
}

export function runIdeCode(code, language, input, timeLimit = DEFAULT_TIME_LIMIT_MS) {
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

    const testCase = { input, output: '' }
    worker.onmessage = (event) => {
      clearTimeout(timer)
      const durationMs = performance.now() - startedAt
      if (event.data.type === 'error') {
        resolve({ output: event.data.error, error: true, durationMs })
        return
      }
      const result = event.data.result
      resolve({
        output: result.error ? result.actual : result.actual,
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
    worker.postMessage({
      code,
      problem: { testCases: [testCase] },
      language,
      testCase,
    })
  })
}
