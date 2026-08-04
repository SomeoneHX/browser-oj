import { computed, ref } from 'vue'
import { checkEmceptionReady, clearResources, deleteEmceptionBundle, downloadResources, EMCEPTION_CACHE_NAME, getCppBundleIds, getEmceptionBundles, type EmceptionBundle } from '../utils/emception'
import { checkPyodideReady, clearPyodideResources, deletePyodideResource, downloadPyodideResources, getPyodideResourceStates, PYODIDE_CACHE_NAME, PYODIDE_RESOURCES, type PyodideResource } from '../utils/pyodide'
import { BRYTHON_CACHE_NAME, BRYTHON_RESOURCES, checkBrythonReady, clearBrythonResources, deleteBrythonResource, downloadBrythonResources, getBrythonResourceStates, type BrythonResource } from '../utils/brython'
import type { ProgressInfo } from '../types'

type PackageItem = {
  id: string
  label: string
  description: string
  size: number
  files: string[]
  installed: boolean
  source: 'emception' | 'pyodide' | 'brython'
}

const cppReady = ref(false)
const pythonReady = ref(false)
const brythonReady = ref(false)
const downloading = ref(false)
const progress = ref<ProgressInfo>({ loaded: 0, total: 0, fileName: null, fileLoaded: 0, fileTotal: 0 })
const error = ref('')
const emceptionBundles = ref<EmceptionBundle[]>([])
const pyodideResources = ref<(PyodideResource & { installed: boolean })[]>([])
const brythonResources = ref<(BrythonResource & { installed: boolean })[]>([])
const cachedSizes = ref({ emception: 0, pyodide: 0, brython: 0 })
let checked = false

export function useEmceptionRuntime() {
  const packages = computed<PackageItem[]>(() => [
    ...emceptionBundles.value.map((item) => ({ ...item, label: item.id, description: `${item.files.length} 个文件`, source: 'emception' as const })),
    ...pyodideResources.value.map((item) => ({ ...item, files: [], source: 'pyodide' as const })),
    ...brythonResources.value.map((item) => ({ ...item, files: [], source: 'brython' as const })),
  ])
  const installedCount = computed(() => packages.value.filter((item) => item.installed).length)
  const installedSize = computed(() => cachedSizes.value.emception + cachedSizes.value.pyodide + cachedSizes.value.brython)

  const refreshCachedSizes = async () => {
    const getCacheSize = async (cacheName: string) => {
      if (typeof caches === 'undefined') return 0
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      const responses = await Promise.all(requests.map((request) => cache.match(request)))
      return (await Promise.all(responses.filter((response): response is Response => !!response).map((response) => response.clone().blob().then((body) => body.size)))).reduce((sum, size) => sum + size, 0)
    }
    const [emception, pyodide, brython] = await Promise.all([
      getCacheSize(EMCEPTION_CACHE_NAME),
      getCacheSize(PYODIDE_CACHE_NAME),
      getCacheSize(BRYTHON_CACHE_NAME),
    ])
    cachedSizes.value = { emception, pyodide, brython }
  }

  const refreshReady = async () => {
    try {
      const [bundles, resources, brython] = await Promise.all([getEmceptionBundles(), getPyodideResourceStates(), getBrythonResourceStates()])
      emceptionBundles.value = bundles
      pyodideResources.value = resources
      brythonResources.value = brython
      const cppIds = getCppBundleIds()
      cppReady.value = cppIds.every((id) => bundles.some((bundle) => bundle.id === id && bundle.installed)) && await checkEmceptionReady()
      pythonReady.value = resources.every((resource) => resource.installed) && await checkPyodideReady()
      brythonReady.value = brython.every((resource) => resource.installed) && await checkBrythonReady()
      await refreshCachedSizes()
    } catch (caught) {
      error.value = (caught as Error).message || '读取开发环境状态失败'
    }
  }

  const ensureChecked = async () => {
    if (checked) return
    checked = true
    await refreshReady()
  }

  const runDownload = async (action: (report: (p: ProgressInfo) => void) => Promise<void>) => {
    if (downloading.value) return
    downloading.value = true
    error.value = ''
    progress.value = { loaded: 0, total: 0, fileName: null, fileLoaded: 0, fileTotal: 0 }
    try {
      await action((item) => { progress.value = { ...item } })
      await refreshReady()
    } catch (caught) {
      error.value = (caught as Error).message || String(caught)
    } finally {
      downloading.value = false
    }
  }

  const downloadCpp = () => runDownload((report) => downloadResources(report, getCppBundleIds()))
  const downloadPython = () => runDownload((report) => downloadPyodideResources(PYODIDE_RESOURCES.map((resource) => resource.id), report))
  const downloadBrython = () => runDownload((report) => downloadBrythonResources(BRYTHON_RESOURCES.map((resource) => resource.id), report))
  const downloadPackage = (item: PackageItem) => runDownload((report) => item.source === 'emception' ? downloadResources(report, [item.id]) : item.source === 'pyodide' ? downloadPyodideResources([item.id], report) : downloadBrythonResources([item.id], report))

  const deletePackage = async (item: PackageItem) => {
    if (downloading.value) return
    if (item.source === 'emception') await deleteEmceptionBundle(item.id)
    else if (item.source === 'pyodide') await deletePyodideResource(item.id)
    else await deleteBrythonResource(item.id)
    await refreshReady()
  }

  const clear = async () => {
    if (downloading.value) return
    await Promise.all([clearResources(), clearPyodideResources(), clearBrythonResources()])
    await refreshReady()
  }

  return { cppReady, pythonReady, brythonReady, downloading, progress, error, packages, installedCount, installedSize, cachedSizes, refreshReady, ensureChecked, downloadCpp, downloadPython, downloadBrython, downloadPackage, deletePackage, clear }
}
