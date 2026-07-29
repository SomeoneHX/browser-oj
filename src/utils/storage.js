const KEYS = {
  NICKNAME: 'antioj_nickname',
  SUBMISSIONS: 'antioj_submissions',
  ACHIEVEMENTS: 'antioj_achievements',
  STATS: 'antioj_stats',
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

export function getAchievements() {
  return getItem(KEYS.ACHIEVEMENTS, {})
}

export function unlockAchievement(id) {
  const ach = getAchievements()
  ach[id] = true
  setItem(KEYS.ACHIEVEMENTS, ach)
}

export function getStats() {
  return getItem(KEYS.STATS, {
    totalSubmissions: 0,
    acCount: 0,
    waCount: 0,
    cheatingCount: 0,
    consecutiveAC: 0,
    longestACStreak: 0,
    cheatedProblems: [],
    commentedTrapCount: 0,
    lastStatus: null,
  })
}

export function updateStats(updater) {
  const stats = getStats()
  const newStats = typeof updater === 'function' ? updater(stats) : { ...stats, ...updater }
  setItem(KEYS.STATS, newStats)
  return newStats
}
