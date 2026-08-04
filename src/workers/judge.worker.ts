import { judgeTestCase } from '../utils/judge'
import type { WorkerRequest, WorkerResponse } from '../types'

const scope = self as unknown as DedicatedWorkerGlobalScope

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { code, language, testCase } = event.data
  try {
    const result = judgeTestCase(code, language, testCase)
    const response: WorkerResponse = { type: 'result', result }
    scope.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      error: (error as Error)?.message || String(error),
    }
    scope.postMessage(response)
  }
}
