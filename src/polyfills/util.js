export function inspect(obj, opts) {
  if (typeof obj === 'string') return obj
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (typeof obj === 'object') {
    try { return JSON.stringify(obj) } catch { return String(obj) }
  }
  return String(obj)
}

export function format(fmt, ...args) {
  let s = fmt
  for (const a of args) {
    s = s.replace(/%[sdifo]/, String(a))
  }
  return s
}
