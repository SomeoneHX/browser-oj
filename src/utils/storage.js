const KEYS = {
  NICKNAME: 'browser_oj_nickname',
  SUBMISSIONS: 'browser_oj_submissions',
}

function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getNickname() {
  return localStorage.getItem(KEYS.NICKNAME) || ''
}

export function setNickname(name) {
  localStorage.setItem(KEYS.NICKNAME, name)
}

export function clearNickname() {
  localStorage.removeItem(KEYS.NICKNAME)
}

export function isLoggedIn() {
  return !!getNickname()
}

export function getSubmissions() {
  return getItem(KEYS.SUBMISSIONS, [])
}

export function addSubmission(submission) {
  const list = getSubmissions()
  list.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    ...submission,
  })
  setItem(KEYS.SUBMISSIONS, list)
  return list[0]
}

export function getSubmission(id) {
  return getSubmissions().find((s) => s.id === id) || null
}
