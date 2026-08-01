import { judgeTestCase } from '../utils/judge'

self.onmessage = (event) => {
  const { code, problem, language, testCase } = event.data
  try {
    const result = judgeTestCase(code, problem, language, testCase)
    self.postMessage({ type: 'result', result })
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error?.message || String(error),
    })
  }
}
