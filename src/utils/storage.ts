import type { LanguageId, Submission, SubmissionUpdates } from '../types'

const KEYS = {
  NICKNAME: 'browser_oj_nickname',
  USER_UID: 'browser_oj_user_uid',
  SUBMISSIONS: 'browser_oj_submissions',
  THEME: 'browser_oj_theme',
}

function getItem<T>(key: string, fallback: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setItem(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getNickname(): string {
  return localStorage.getItem(KEYS.NICKNAME) || ''
}

export function setNickname(name: string) {
  localStorage.setItem(KEYS.NICKNAME, name)
}

export function getUserUid(): string {
  return localStorage.getItem(KEYS.USER_UID) || ''
}

export function setUserUid(uid: string | number | undefined | null) {
  if (uid === undefined || uid === null || uid === '') {
    localStorage.removeItem(KEYS.USER_UID)
    return
  }
  localStorage.setItem(KEYS.USER_UID, String(uid))
}

export function clearNickname() {
  localStorage.removeItem(KEYS.NICKNAME)
  localStorage.removeItem(KEYS.USER_UID)
}

export function isLoggedIn(): boolean {
  return !!getNickname()
}

export function getSubmissions(): Submission[] {
  return getItem<Submission[]>(KEYS.SUBMISSIONS, []) || []
}

export function addSubmission(submission: Omit<Submission, 'id' | 'timestamp'>): Submission {
  const list = getSubmissions()
  const created: Submission = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    ...submission,
  }
  list.unshift(created)
  setItem(KEYS.SUBMISSIONS, list)
  return created
}

export function updateSubmission(id: string, updates: SubmissionUpdates): Submission | null {
  const list = getSubmissions()
  const index = list.findIndex((submission) => submission.id === id)
  if (index === -1) return null
  list[index] = { ...list[index], ...updates }
  setItem(KEYS.SUBMISSIONS, list)
  window.dispatchEvent(new CustomEvent('submission-updated', { detail: { id } }))
  return list[index]
}

export function getSubmission(id: string): Submission | null {
  return getSubmissions().find((s) => s.id === id) || null
}

export interface IdeDraft {
  code: string
  language: LanguageId
  input: string
}

export function getIdeDraft(): IdeDraft {
  return {
    code: getItem<string>('browser_oj_ide_code', '') || '',
    language: (getItem<string>('browser_oj_ide_language', 'cpp') || 'cpp') as LanguageId,
    input: getItem<string>('browser_oj_ide_input', '') || '',
  }
}

export function saveIdeDraft(draft: IdeDraft) {
  setItem('browser_oj_ide_code', draft.code)
  setItem('browser_oj_ide_language', draft.language)
  setItem('browser_oj_ide_input', draft.input)
}

export interface ThemeSettings {
  backgroundImage: string
  backgroundFullScreen: boolean
  glassEnabled: boolean
  opacity: number
  blur: number
}

export const DEFAULT_THEME: ThemeSettings = {
  backgroundImage: 'https://cdn.luogu.com.cn/images/bg/fe/luogu4-bg-l.jpg',
  backgroundFullScreen: false,
  glassEnabled: true,
  opacity: 0.72,
  blur: 10,
}

export function getThemeSettings(): ThemeSettings {
  const saved = getItem<Partial<ThemeSettings>>(KEYS.THEME, {}) || {}
  return {
    ...DEFAULT_THEME,
    ...saved,
    opacity: Math.min(1, Math.max(0.2, Number(saved.opacity ?? DEFAULT_THEME.opacity))),
    blur: Math.min(24, Math.max(0, Number(saved.blur ?? DEFAULT_THEME.blur))),
  }
}

export function saveThemeSettings(settings: ThemeSettings) {
  setItem(KEYS.THEME, settings)
  window.dispatchEvent(new CustomEvent('theme-updated'))
}

export function resetThemeSettings() {
  saveThemeSettings(DEFAULT_THEME)
}
