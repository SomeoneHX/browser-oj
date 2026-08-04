import { createEmception, BROWSER_BUILD_PRESETS } from '@gameguild/emception-browser'
import type { EmceptionAPI } from '@gameguild/emception-browser'
import { updateSubmission } from './storage'
import { normalize } from './judge'
import type { CompileError, ProgressInfo, Problem, RunOutput, Submission, TestResult } from '../types'

export const EMCEPTION_VERSION = '3.8.0'
export const MANIFEST_URL = `https://cdn.jsdelivr.net/npm/emception@${EMCEPTION_VERSION}/cdn/manifest.json`
export const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/emception@${EMCEPTION_VERSION}/cdn/`
export const EMCEPTION_CACHE_NAME = `emception-${EMCEPTION_VERSION}`
const READY_KEY = 'browser_oj_emception_ready'
const COMPILE_TIMEOUT_MS = 300000
const RUNTIME_PREPARE_TIMEOUT_MS = 60000
const BROTLI_ESTIMATE_BYTES = 190000
const STALL_TIMEOUT_MS = 60000
const CONCURRENCY = 3
const CDN_HOSTS = ['cdn', 'gcore', 'fastly']

const CORE_BUNDLES = ['clang', 'clang-headers', 'usr-include', 'lld', 'cache-core', 'cache-crt']
const SHARED_FILES = ['manifest.json', 'brotli_wasm.js', 'brotli_wasm.wasm']

export interface EmceptionBundle {
  id: string
  url: string
  size: number
  files: string[]
  installed: boolean
}

const PATHS = {
  sourcePath: '/home/user/main.cpp',
  objectPath: '/home/user/main.o',
  wasmPath: '/home/user/main.wasm',
}
const CPP_PRESET = BROWSER_BUILD_PRESETS['cpp']

let apiInstance: EmceptionAPI | null = null
let booting: Promise<EmceptionAPI> | null = null

export async function checkEmceptionReady(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  try {
    const [manifest, cache] = await Promise.all([getManifest(), caches.open(EMCEPTION_CACHE_NAME)])
    const cachedBundles = await Promise.all(CORE_BUNDLES.map((id) => {
      const bundle = manifest.bundles?.[id]
      return bundle ? cache.match(CDN_PREFIX + bundle.url.replace(/^\/cdn\//, '')) : Promise.resolve(undefined)
    }))
    return cachedBundles.every(Boolean)
  } catch {
    return false
  }
}

export async function hasEmceptionResidue(): Promise<boolean> {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(READY_KEY)) return true
  if (typeof caches !== 'undefined') {
    try {
      return await caches.has(EMCEPTION_CACHE_NAME)
    } catch {
      return false
    }
  }
  return false
}

export function getEmception(): Promise<EmceptionAPI> {
  if (apiInstance) return Promise.resolve(apiInstance)
  if (!booting) {
    booting = createEmception({ tty: 'none', manifestUrl: MANIFEST_URL })
      .then((api) => {
        apiInstance = api
        return api
      })
      .catch((error: unknown) => {
        booting = null
        throw error
      })
  }
  return booting
}

export function resetEmception() {
  if (apiInstance) {
    try {
      apiInstance.dispose()
    } catch {
      /* ignore */
    }
  }
  apiInstance = null
  booting = null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | { timeout: true }> {
  return Promise.race([
    promise,
    new Promise<{ timeout: true }>((resolve) => setTimeout(() => resolve({ timeout: true }), ms)),
  ])
}

function makeStdinFeeder(input: string | null | undefined): (() => number | null) | undefined {
  if (input === undefined || input === null) return undefined
  const bytes = new TextEncoder().encode(String(input).endsWith('\n') ? String(input) : String(input) + '\n')
  let index = 0
  return () => (index >= bytes.length ? null : bytes[index++])
}

function hostUrlFor(url: string, host: string): string {
  if (host === CDN_HOSTS[0]) return url
  return url.replace('https://cdn.jsdelivr.net', `https://${host}.jsdelivr.net`)
}

async function fetchToCache(cache: Cache, url: string, onItemProgress: (loadedNow: number, total: number) => void) {
  let lastError: Error | null = null
  for (const host of CDN_HOSTS) {
    const controller = new AbortController()
    let stallTimer = setTimeout(() => controller.abort(), STALL_TIMEOUT_MS)
    const restartStallTimer = () => {
      clearTimeout(stallTimer)
      stallTimer = setTimeout(() => controller.abort(), STALL_TIMEOUT_MS)
    }
    try {
      const response = await fetch(hostUrlFor(url, host), { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const total = Number(response.headers.get('content-length')) || 0
      if (!response.body || !total) {
        clearTimeout(stallTimer)
        await cache.put(url, response)
        onItemProgress(0, 0)
        return
      }
      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let loaded = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        loaded += value.byteLength
        onItemProgress(loaded, total)
        restartStallTimer()
      }
      clearTimeout(stallTimer)
      const bytes = new Uint8Array(loaded)
      let offset = 0
      for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
      }
      await cache.put(url, new Response(bytes, { headers: response.headers }))
      onItemProgress(loaded, total)
      return
    } catch (error) {
      clearTimeout(stallTimer)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }
  throw new Error(`多次重试失败（${lastError?.message || '网络错误'}）`)
}

async function fetchWithStall(url: string): Promise<Response> {
  const controller = new AbortController()
  const stallTimer = setTimeout(() => controller.abort(), STALL_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(stallTimer)
  }
}

interface DownloadItem {
  fileName: string
  url: string
  size: number
}

async function getManifest() {
  try {
    const manifestResponse = await fetchWithStall(MANIFEST_URL)
    if (!manifestResponse.ok) throw new Error(`HTTP ${manifestResponse.status}`)
    return (await manifestResponse.json()) as { bundles?: Record<string, { url: string; size?: number; files?: string[] }> }
  } catch (error) {
    const cached = await caches.open(EMCEPTION_CACHE_NAME).then((cache) => cache.match(MANIFEST_URL))
    if (cached) return cached.json() as Promise<{ bundles?: Record<string, { url: string; size?: number; files?: string[] }> }>
    throw new Error(`获取资源清单失败 (${(error as Error).message || '网络错误'})`)
  }
}

export async function getEmceptionBundles(): Promise<EmceptionBundle[]> {
  const manifest = await getManifest()
  const cache = await caches.open(EMCEPTION_CACHE_NAME)
  return Promise.all(Object.entries(manifest.bundles || {}).map(async ([id, bundle]) => {
    const url = CDN_PREFIX + bundle.url.replace(/^\/cdn\//, '')
    return { id, url, size: bundle.size || 0, files: bundle.files || [], installed: !!(await cache.match(url)) }
  }))
}

export async function downloadResources(onProgress: (p: ProgressInfo) => void = () => {}, bundleIds = CORE_BUNDLES) {
  const manifest = await getManifest()
  const cache = await caches.open(EMCEPTION_CACHE_NAME)
  const allBundles = Object.entries(manifest.bundles || {})
  const selectedBundles = allBundles.filter(([name]) => bundleIds.includes(name))
  const items: DownloadItem[] = [
    { fileName: 'manifest.json', url: MANIFEST_URL, size: new TextEncoder().encode(JSON.stringify(manifest)).byteLength },
    ...selectedBundles.map(([name, bundle]) => ({
      fileName: bundle.url.split('/').pop() || name,
      url: CDN_PREFIX + bundle.url.replace(/^\/cdn\//, ''),
      size: bundle.size || 0,
    })),
    { fileName: 'brotli_wasm.js', url: `${CDN_PREFIX}brotli_wasm.js`, size: BROTLI_ESTIMATE_BYTES },
    { fileName: 'brotli_wasm.wasm', url: `${CDN_PREFIX}brotli_wasm.wasm`, size: BROTLI_ESTIMATE_BYTES },
  ]
  const total = items.reduce((sum, item) => sum + item.size, 0)

  let loaded = 0
  const failures: string[] = []
  const queue = [...items]

  async function worker() {
    while (queue.length) {
      const item = queue.shift() as DownloadItem
      let itemLoaded = 0
      try {
        await fetchToCache(cache, item.url, (loadedNow) => {
          loaded += loadedNow - itemLoaded
          itemLoaded = loadedNow
          onProgress({ loaded, total, fileName: item.fileName, fileLoaded: loadedNow, fileTotal: item.size })
        })
      } catch (error) {
        failures.push(`${item.fileName}（${error instanceof Error ? error.message : '网络错误'}）`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker()))

  if (failures.length) {
    throw new Error(`以下资源下载失败，请重试（已完成的部分会自动跳过）：${failures.join('、')}`)
  }
  localStorage.setItem(READY_KEY, EMCEPTION_VERSION)
  onProgress({ loaded, total, fileName: null, fileLoaded: 0, fileTotal: 0 })
}

export async function deleteEmceptionBundle(id: string) {
  const manifest = await getManifest()
  const bundle = manifest.bundles?.[id]
  if (!bundle) return
  const cache = await caches.open(EMCEPTION_CACHE_NAME)
  await cache.delete(CDN_PREFIX + bundle.url.replace(/^\/cdn\//, ''))
  localStorage.removeItem(READY_KEY)
}

export function getCppBundleIds() {
  return [...CORE_BUNDLES]
}

export function getSharedResourceNames() {
  return [...SHARED_FILES]
}

export async function clearResources() {
  localStorage.removeItem(READY_KEY)
  resetEmception()
  if (typeof caches !== 'undefined') {
    try {
      await caches.delete(EMCEPTION_CACHE_NAME)
    } catch {
      /* ignore */
    }
  }
}

async function ensureWasmReady(): Promise<EmceptionAPI> {
  if (!(await checkEmceptionReady())) {
    throw new Error('C++ (WASM) 资源未下载，请先在「开发环境」页面下载资源')
  }
  return getEmception()
}

async function compileOnce(api: EmceptionAPI, code: string) {
  await api.writeFile(PATHS.sourcePath, code)
  // 过滤异常处理标志：emception 自带 libc++ 是 -fno-exceptions 构建的 noexcept 库，
  // 开启 EH 会链接错配导致 wasm 产物 section 表损坏（实测 while(1)+cout 由损坏转正常）。
  // 副作用：用户代码使用 try/catch 会编译失败，OJ 场景可接受。
  const compileArgv = CPP_PRESET.compileArgv(PATHS).filter((arg) => arg !== '-fcxx-exceptions' && arg !== '-fexceptions')
  const compile = await withTimeout(
    api.run(CPP_PRESET.compileTool, compileArgv, { cwd: '/home/user' }),
    COMPILE_TIMEOUT_MS,
  )
  if ('timeout' in compile) {
    resetEmception()
    throw { phase: 'compile', message: '编译超时', detail: '编译时间超过 300 秒' } satisfies CompileError
  }
  if (compile.exitCode !== 0) {
    throw { phase: 'compile', message: '编译错误', detail: (compile.stderr || compile.stdout || '').trim() } satisfies CompileError
  }
  const link = await withTimeout(
    api.run(CPP_PRESET.linkTool, CPP_PRESET.linkArgv(PATHS), { cwd: '/home/user' }),
    COMPILE_TIMEOUT_MS,
  )
  if ('timeout' in link) {
    resetEmception()
    throw { phase: 'link', message: '链接超时', detail: '链接时间超过 300 秒' } satisfies CompileError
  }
  if (link.exitCode !== 0) {
    throw { phase: 'link', message: '链接错误', detail: (link.stderr || link.stdout || '').trim() } satisfies CompileError
  }
}

async function prepareWasiRuntime(api: EmceptionAPI) {
  const result = await withTimeout(api.run('wasi-run', ['wasi-run', '--help'], { cwd: '/home/user' }), RUNTIME_PREPARE_TIMEOUT_MS)
  if ('timeout' in result) {
    resetEmception()
    throw new Error('C++ 运行环境启动超时')
  }
}

async function runWasmOnce(api: EmceptionAPI, input: string, timeLimit: number): Promise<RunOutput> {
  const startedAt = performance.now()
  const result = await withTimeout(
    api.run('wasi-run', ['wasi-run', PATHS.wasmPath], { cwd: '/home/user', stdin: makeStdinFeeder(input) }),
    timeLimit,
  )
  if ('timeout' in result) {
    resetEmception()
    return { output: '运行超时', error: true, timeout: true, durationMs: timeLimit }
  }
  const detail = (result.stderr || '').trim()
  if (result.exitCode !== 0 && /WebAssembly\.compile|unknown section code|unexpected section/.test(detail)) {
    console.warn('[emception] wasm 产物损坏（工具链缺陷）:', detail)
    return {
      output: '编译器产物异常（工具链缺陷），请调整代码写法（如避免在无限循环内直接使用 printf）',
      error: true,
      durationMs: performance.now() - startedAt,
    }
  }
  return {
    output: (result.stdout || '').trim(),
    error: result.exitCode !== 0,
    detail,
    durationMs: performance.now() - startedAt,
  }
}

export async function runWasmIde(code: string, input: string, timeLimit = 5000): Promise<RunOutput> {
  const startedAt = performance.now()
  try {
    const api = await ensureWasmReady()
    await compileOnce(api, code)
    await prepareWasiRuntime(api)
    return await runWasmOnce(api, input, timeLimit)
  } catch (error) {
    return {
      output: (error as { detail?: string; message?: string })?.detail || (error as Error)?.message || String(error),
      error: true,
      durationMs: performance.now() - startedAt,
    }
  }
}

export async function runWasmJudge(submission: Submission, problem: Problem) {
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
  updateSubmission(submission.id, { status: 'compiling' })

  let api: EmceptionAPI
  try {
    api = await ensureWasmReady()
    await compileOnce(api, submission.code)
    await prepareWasiRuntime(api)
    updateSubmission(submission.id, { status: 'running' })
  } catch (error) {
    const compileError = (error as { detail?: string; message?: string })?.detail || (error as Error)?.message || '编译失败'
    for (let index = 0; index < results.length; index += 1) {
      results[index] = {
        ...results[index],
        actual: index === 0 ? compileError : '未运行',
        status: index === 0 ? 'error' : 'skipped',
        error: true,
      }
    }
    updateSubmission(submission.id, {
      status: 'error',
      passedTests: 0,
      totalTests: testCases.length,
      output: compileError,
      similarity: 0,
      testResults: results,
    })
    return
  }

  try {
    for (let index = 0; index < testCases.length; index += 1) {
      results[index] = { ...results[index], status: 'running' }
      updateSubmission(submission.id, { testResults: [...results] })

      const result = await runWasmOnce(api, testCases[index].input, problem.timeLimit)
      const passed = !result.error && normalize(result.output) === normalize(testCases[index].output)
      results[index] = {
        ...results[index],
        actual: result.timeout ? '运行超时' : result.output,
        passed,
        error: result.error,
        timeout: result.timeout,
        durationMs: result.durationMs,
        status: result.timeout ? 'timeout' : result.error ? 'error' : passed ? 'passed' : 'failed',
      }
      if (result.error && result.detail) results[index].actual = result.detail
      const passedTests = results.filter((test) => test.passed).length
      updateSubmission(submission.id, { testResults: [...results], passedTests })

      if (result.timeout) {
        for (let rest = index + 1; rest < testCases.length; rest += 1) {
          results[rest] = { ...results[rest], status: 'skipped', actual: '未运行' }
        }
        break
      }
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
      output: (error as Error)?.message || 'C++ (WASM) 评测启动失败',
      testResults: [...results],
    })
  }
}
