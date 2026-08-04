const DEFAULT_TIME_LIMIT_MS = 5000

import { runWasmIde } from './emception'
import { WASM_LANGUAGE } from './languages'
import type { LanguageId, RunOutput, TestCase, WorkerRequest, WorkerResponse } from '../types'

export function runIdeCode(code: string, language: LanguageId, input: string, timeLimit = DEFAULT_TIME_LIMIT_MS): Promise<RunOutput> {
  if (language === WASM_LANGUAGE) return runWasmIde(code, input, timeLimit)
  return new Promise((resolve) => {
    const startedAt = performance.now()
    let worker: Worker
    let settled = false
    const finish = (result: RunOutput) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker?.terminate()
      resolve(result)
    }
    try {
      worker = new Worker(new URL('../workers/judge.worker.ts', import.meta.url), { type: 'module' })
    } catch (error) {
      resolve({
        output: (error as Error)?.message || 'IDE Worker 启动失败',
        error: true,
        durationMs: performance.now() - startedAt,
      })
      return
    }
    const timer = setTimeout(() => {
      finish({
        output: '运行超时',
        error: true,
        timeout: true,
        durationMs: timeLimit,
      })
    }, timeLimit)

    const testCase: TestCase = { input, output: '' }
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const durationMs = performance.now() - startedAt
      if (event.data.type === 'error') {
        finish({ output: event.data.error, error: true, durationMs })
        return
      }
      const result = event.data.result
      finish({
        output: result.actual || '',
        error: result.error,
        durationMs,
      })
    }
    worker.onerror = (event) => {
      finish({
        output: event.message || (event.error as Error | undefined)?.message || 'IDE Worker 运行错误',
        error: true,
        durationMs: performance.now() - startedAt,
      })
    }
    worker.onmessageerror = () => finish({
      output: 'IDE Worker 消息通信失败',
      error: true,
      durationMs: performance.now() - startedAt,
    })
    const payload: WorkerRequest = {
      code,
      language,
      testCase,
    }
    worker.postMessage(payload)
  })
}
