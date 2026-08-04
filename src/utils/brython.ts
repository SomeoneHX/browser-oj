import { normalize } from './judge'
import { updateSubmission } from './storage'
import type { Problem, ProgressInfo, RunOutput, Submission, TestResult } from '../types'

export const BRYTHON_VERSION = '3.12.5'
export const BRYTHON_PREFIX = `https://cdn.jsdelivr.net/npm/brython@${BRYTHON_VERSION}/`
export const BRYTHON_CACHE_NAME = `brython-${BRYTHON_VERSION}`
const READY_KEY = 'browser_oj_brython_ready'
const PREPARE_TIMEOUT_MS = 60000

export interface BrythonResource {
  id: string
  label: string
  description: string
  size: number
}

export const BRYTHON_RESOURCES: BrythonResource[] = [
  { id: 'brython.js', label: 'Brython interpreter', description: 'Python-to-JavaScript interpreter runtime', size: 1188170 },
  { id: 'brython_stdlib.js', label: 'Brython standard library', description: 'Python standard-library virtual file system', size: 4391090 },
]

const urlFor = (id: string) => BRYTHON_PREFIX + id

export async function getBrythonResourceStates() {
  const cache = await caches.open(BRYTHON_CACHE_NAME)
  return Promise.all(BRYTHON_RESOURCES.map(async (resource) => ({ ...resource, installed: !!(await cache.match(urlFor(resource.id))) })))
}

export async function checkBrythonReady() {
  if (typeof localStorage === 'undefined' || localStorage.getItem(READY_KEY) !== BRYTHON_VERSION) return false
  return (await getBrythonResourceStates()).every((resource) => resource.installed)
}

export async function downloadBrythonResources(ids = BRYTHON_RESOURCES.map((resource) => resource.id), onProgress: (progress: ProgressInfo) => void = () => {}) {
  const cache = await caches.open(BRYTHON_CACHE_NAME)
  const resources = BRYTHON_RESOURCES.filter((resource) => ids.includes(resource.id))
  let loaded = 0
  const total = resources.reduce((sum, resource) => sum + resource.size, 0)
  for (const resource of resources) {
    const url = urlFor(resource.id)
    const cached = await cache.match(url)
    if (cached) {
      loaded += resource.size
      onProgress({ loaded, total, fileName: resource.id, fileLoaded: resource.size, fileTotal: resource.size })
      continue
    }
    const response = await fetch(url)
    if (!response.ok || !response.body) throw new Error(`${resource.id} 下载失败 (HTTP ${response.status})`)
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let fileLoaded = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      fileLoaded += value.byteLength
      onProgress({ loaded: loaded + fileLoaded, total, fileName: resource.id, fileLoaded, fileTotal: resource.size })
    }
    loaded += fileLoaded
    const bytes = new Uint8Array(fileLoaded)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    await cache.put(url, new Response(bytes, { headers: response.headers }))
  }
  if ((await getBrythonResourceStates()).every((resource) => resource.installed)) localStorage.setItem(READY_KEY, BRYTHON_VERSION)
  onProgress({ loaded, total, fileName: null, fileLoaded: 0, fileTotal: 0 })
}

export async function deleteBrythonResource(id: string) {
  const cache = await caches.open(BRYTHON_CACHE_NAME)
  await cache.delete(urlFor(id))
  localStorage.removeItem(READY_KEY)
}

export async function clearBrythonResources() {
  localStorage.removeItem(READY_KEY)
  await caches.delete(BRYTHON_CACHE_NAME)
}

function runBrythonCase(code: string, input: string, timeLimit: number): Promise<RunOutput> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/brython.worker.ts', import.meta.url))
    const prepareTimer = setTimeout(() => {
      worker.terminate()
      resolve({ output: 'Brython 运行环境启动超时', error: true, durationMs: 0 })
    }, PREPARE_TIMEOUT_MS)
    let runTimer: ReturnType<typeof setTimeout> | null = null
    let startedAt = 0
    const finish = (result: RunOutput) => {
      clearTimeout(prepareTimer)
      if (runTimer) clearTimeout(runTimer)
      worker.terminate()
      resolve(result)
    }
    worker.onmessage = (event: MessageEvent<{ type: 'ready' | 'result'; output?: string; error?: string }>) => {
      if (event.data.type === 'ready') {
        clearTimeout(prepareTimer)
        if (event.data.error) {
          finish({ output: event.data.error, error: true, durationMs: 0 })
          return
        }
        startedAt = performance.now()
        runTimer = setTimeout(() => finish({ output: '运行超时', error: true, timeout: true, durationMs: timeLimit }), timeLimit)
        worker.postMessage({ type: 'run', code, input })
        return
      }
      finish({ output: event.data.error || event.data.output || '', error: !!event.data.error, durationMs: performance.now() - startedAt })
    }
    worker.onerror = (event) => finish({ output: event.message || 'Brython Worker 运行错误', error: true, durationMs: startedAt ? performance.now() - startedAt : 0 })
    worker.postMessage({ type: 'prepare', prefix: BRYTHON_PREFIX })
  })
}

export function runBrython(code: string, input: string, timeLimit: number) {
  return runBrythonCase(code, input, timeLimit)
}

export async function runBrythonJudge(submission: Submission, problem: Problem) {
  const testCases = problem.testCases || []
  const results: TestResult[] = testCases.map((testCase) => ({ input: testCase.input, expected: testCase.output, actual: null, status: 'pending', passed: false, error: false, durationMs: null }))
  updateSubmission(submission.id, { status: 'running', testResults: results, passedTests: 0 })
  for (let index = 0; index < testCases.length; index += 1) {
    results[index] = { ...results[index], status: 'running' }
    updateSubmission(submission.id, { testResults: [...results] })
    const result = await runBrythonCase(submission.code, testCases[index].input, problem.timeLimit)
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
