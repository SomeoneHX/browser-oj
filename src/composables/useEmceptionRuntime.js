import { ref } from 'vue'
import {
  checkEmceptionReady,
  downloadResources,
  clearResources,
  hasEmceptionResidue,
  isFullPackageInstalled,
} from '../utils/emception'

const ready = ref(false)
const residue = ref(false)
const fullInstalled = ref(false)
const downloading = ref(false)
const progress = ref({ loaded: 0, total: 0 })
const error = ref('')
let checked = false

export function useEmceptionRuntime() {
  const refreshReady = async () => {
    ready.value = await checkEmceptionReady()
    residue.value = ready.value || (await hasEmceptionResidue())
    fullInstalled.value = isFullPackageInstalled()
  }

  const ensureChecked = async () => {
    if (checked) return
    checked = true
    await refreshReady()
  }

  const download = async (coreOnly = true) => {
    if (downloading.value) return
    downloading.value = true
    error.value = ''
    progress.value = { loaded: 0, total: 0 }
    try {
      await downloadResources(
        (p) => {
          progress.value = { ...p }
        },
        { coreOnly },
      )
      ready.value = true
      residue.value = true
      if (!coreOnly) fullInstalled.value = true
    } catch (err) {
      error.value = err?.message || String(err)
    } finally {
      downloading.value = false
    }
  }

  const clear = async () => {
    await clearResources()
    ready.value = false
    residue.value = false
    fullInstalled.value = false
    progress.value = { loaded: 0, total: 0 }
    error.value = ''
  }

  return {
    ready,
    residue,
    fullInstalled,
    downloading,
    progress,
    error,
    refreshReady,
    ensureChecked,
    download,
    clear,
  }
}
