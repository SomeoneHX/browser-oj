import { normalize } from './judge'
import { updateSubmission } from './storage'
import type { Problem, ProgressInfo, RunOutput, Submission, TestResult } from '../types'

export const PYODIDE_VERSION = '0.29.3'
export const PYODIDE_PREFIX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
export const PYODIDE_CACHE_NAME = `pyodide-${PYODIDE_VERSION}`
const READY_KEY = 'browser_oj_pyodide_ready'
const PREPARE_TIMEOUT_MS = 60000

export interface PyodideResource {
  id: string
  label: string
  description: string
  size: number
}

// These are the files required before the Python interpreter can start offline.
export const PYODIDE_RESOURCES: PyodideResource[] = [
  { id: 'pyodide.mjs', label: 'Pyodide loader', description: 'JavaScript module loader', size: 0 },
  { id: 'pyodide.asm.js', label: 'Pyodide runtime', description: 'Emscripten JavaScript runtime', size: 0 },
  { id: 'pyodide.asm.wasm', label: 'Python interpreter', description: 'CPython WebAssembly runtime', size: 0 },
  { id: 'python_stdlib.zip', label: 'Python standard library', description: 'Built-in Python modules', size: 0 },
  { id: 'pyodide-lock.json', label: 'Package lockfile', description: 'Runtime package metadata', size: 0 },
]

function urlFor(id: string) {
  return PYODIDE_PREFIX + id
}

export async function getPyodideResourceStates() {
  const cache = await caches.open(PYODIDE_CACHE_NAME)
  return Promise.all(PYODIDE_RESOURCES.map(async (resource) => ({ ...resource, installed: !!(await cache.match(urlFor(resource.id))) })))
}

export async function checkPyodideReady() {
  if (typeof localStorage === 'undefined' || localStorage.getItem(READY_KEY) !== PYODIDE_VERSION) return false
  const states = await getPyodideResourceStates()
  return states.every((resource) => resource.installed)
}

export async function downloadPyodideResources(ids = PYODIDE_RESOURCES.map((resource) => resource.id), onProgress: (progress: ProgressInfo) => void = () => {}) {
  const cache = await caches.open(PYODIDE_CACHE_NAME)
  const resources = PYODIDE_RESOURCES.filter((resource) => ids.includes(resource.id))
  let loaded = 0
  let total = 0
  const responses = await Promise.all(resources.map(async (resource) => {
    const existing = await cache.match(urlFor(resource.id))
    if (existing) return { resource, response: existing.clone(), cached: true }
    const response = await fetch(urlFor(resource.id))
    if (!response.ok) throw new Error(`${resource.id} 下载失败 (HTTP ${response.status})`)
    return { resource, response, cached: false }
  }))
  total = responses.reduce((sum, item) => sum + (Number(item.response.headers.get('content-length')) || 0), 0)
  for (const item of responses) {
    const size = Number(item.response.headers.get('content-length')) || 0
    if (item.cached) {
      loaded += size
      onProgress({ loaded, total, fileName: item.resource.id, fileLoaded: size, fileTotal: size })
      continue
    }
    if (!item.response.body) {
      await cache.put(urlFor(item.resource.id), item.response)
      continue
    }
    const reader = item.response.body.getReader()
    const chunks: Uint8Array[] = []
    let fileLoaded = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      fileLoaded += value.byteLength
      onProgress({ loaded: loaded + fileLoaded, total, fileName: item.resource.id, fileLoaded, fileTotal: size })
    }
    loaded += fileLoaded
    const bytes = new Uint8Array(fileLoaded)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    await cache.put(urlFor(item.resource.id), new Response(bytes, { headers: item.response.headers }))
  }
  if (await checkPyodideFilesPresent()) localStorage.setItem(READY_KEY, PYODIDE_VERSION)
  onProgress({ loaded, total, fileName: null, fileLoaded: 0, fileTotal: 0 })
}

async function checkPyodideFilesPresent() {
  const states = await getPyodideResourceStates()
  return states.every((resource) => resource.installed)
}

export async function deletePyodideResource(id: string) {
  const cache = await caches.open(PYODIDE_CACHE_NAME)
  await cache.delete(urlFor(id))
  localStorage.removeItem(READY_KEY)
}

export async function clearPyodideResources() {
  localStorage.removeItem(READY_KEY)
  await caches.delete(PYODIDE_CACHE_NAME)
}

class PyodideSession {
  private worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), { type: 'module' })
  private requestId = 0

  prepare(timeoutMs = PREPARE_TIMEOUT_MS): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId
      const timer = setTimeout(() => {
        this.dispose()
        reject(new Error('Python 运行环境启动超时'))
      }, timeoutMs)
      this.worker.onmessage = (event: MessageEvent<{ id: number; type?: string; error?: string }>) => {
        if (event.data.id !== id || event.data.type !== 'ready') return
        clearTimeout(timer)
        this.worker.onmessage = null
        this.worker.onerror = null
        if (event.data.error) reject(new Error(event.data.error))
        else resolve()
      }
      this.worker.onerror = (event) => {
        clearTimeout(timer)
        reject(new Error(event.message || 'Python 运行环境启动失败'))
      }
      this.worker.postMessage({ type: 'prepare', id, indexURL: PYODIDE_PREFIX })
    })
  }

  run(code: string, input: string, timeLimit: number): Promise<RunOutput> {
    return new Promise((resolve) => {
      const startedAt = performance.now()
      const id = ++this.requestId
      let settled = false
      const finish = (result: RunOutput) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        this.worker.onmessage = null
        this.worker.onerror = null
        resolve(result)
      }
      const timer = setTimeout(() => {
        this.dispose()
        finish({ output: '运行超时', error: true, timeout: true, durationMs: timeLimit })
      }, timeLimit)
      this.worker.onmessage = (event: MessageEvent<{ id: number; output: string; error?: string }>) => {
        if (event.data.id !== id) return
        finish({ output: event.data.error || event.data.output, error: !!event.data.error, durationMs: performance.now() - startedAt })
      }
      this.worker.onerror = (event) => finish({ output: event.message || 'Python Worker 运行错误', error: true, durationMs: performance.now() - startedAt })
      this.worker.postMessage({ id, code, input, indexURL: PYODIDE_PREFIX })
    })
  }

  dispose() {
    this.worker.terminate()
  }
}

export async function runPyodide(code: string, input: string, timeLimit: number): Promise<RunOutput> {
  const session = new PyodideSession()
  try {
    await session.prepare()
    return await session.run(code, input, timeLimit)
  } finally {
    session.dispose()
  }
}

export async function runPyodideJudge(submission: Submission, problem: Problem) {
  const testCases = problem.testCases || []
  const results: TestResult[] = testCases.map((testCase) => ({ input: testCase.input, expected: testCase.output, actual: null, status: 'pending', passed: false, error: false, durationMs: null }))
  updateSubmission(submission.id, { status: 'running', testResults: results, passedTests: 0 })
  const session = new PyodideSession()
  try {
    try {
      await session.prepare()
    } catch (error) {
      const message = (error as Error).message || 'Python 运行环境启动失败'
      for (let index = 0; index < results.length; index += 1) results[index] = { ...results[index], actual: index === 0 ? message : '未运行', status: index === 0 ? 'error' : 'skipped', error: true }
      updateSubmission(submission.id, { status: 'error', passedTests: 0, totalTests: testCases.length, output: message, similarity: 0, testResults: results })
      return
    }
    for (let index = 0; index < testCases.length; index += 1) {
      results[index] = { ...results[index], status: 'running' }
      updateSubmission(submission.id, { testResults: [...results] })
      const result = await session.run(submission.code, testCases[index].input, problem.timeLimit)
      const passed = !result.error && normalize(result.output) === normalize(testCases[index].output)
      results[index] = { ...results[index], actual: result.output, passed, error: result.error, timeout: result.timeout, durationMs: result.durationMs, status: result.timeout ? 'timeout' : result.error ? 'error' : passed ? 'passed' : 'failed' }
      if (result.error) {
        for (let rest = index + 1; rest < results.length; rest += 1) results[rest] = { ...results[rest], status: 'skipped', actual: '未运行' }
      }
      updateSubmission(submission.id, { testResults: [...results], passedTests: results.filter((item) => item.passed).length })
      if (result.error) break
    }
  } finally {
    session.dispose()
  }
  const passedTests = results.filter((item) => item.passed).length
  const hasTimeout = results.some((item) => item.timeout)
  const hasError = results.some((item) => item.error && !item.timeout)
  updateSubmission(submission.id, { status: hasTimeout ? 'tle' : hasError ? 'error' : passedTests === testCases.length ? 'ac' : 'wa', passedTests, totalTests: testCases.length, output: results.find((item) => !item.passed)?.actual || null, similarity: testCases.length ? passedTests / testCases.length : 0 })
}
