import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DEFAULT_THEME, getThemeSettings, saveThemeSettings, type ThemeSettings } from '../utils/storage'

const savedSettings = ref<ThemeSettings>(getThemeSettings())
const previewSettings = ref<ThemeSettings | null>(null)
const settings = computed(() => previewSettings.value || savedSettings.value)

function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement
  root.style.setProperty('--surface-opacity', String(theme.opacity))
  root.style.setProperty('--glass-blur', `${theme.glassEnabled ? theme.blur : 0}px`)
}

function applyCurrentTheme() {
  applyTheme(settings.value)
}

function onThemeUpdated() {
  savedSettings.value = getThemeSettings()
  previewSettings.value = null
  applyCurrentTheme()
}

export function useTheme() {
  onMounted(() => {
    applyCurrentTheme()
    window.addEventListener('theme-updated', onThemeUpdated)
  })

  onBeforeUnmount(() => window.removeEventListener('theme-updated', onThemeUpdated))

  const preview = (next: ThemeSettings) => {
    previewSettings.value = { ...next }
    applyCurrentTheme()
  }

  const save = (next: ThemeSettings) => {
    const saved = { ...next }
    savedSettings.value = saved
    previewSettings.value = null
    applyTheme(saved)
    saveThemeSettings(saved)
  }

  const restore = () => {
    previewSettings.value = null
    applyCurrentTheme()
  }

  return {
    settings,
    savedSettings,
    defaults: DEFAULT_THEME,
    preview,
    save,
    restore,
  }
}
