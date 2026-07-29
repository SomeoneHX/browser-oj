import JSCPP from 'JSCPP'
import { TRAP_VARIABLES } from '../data/problems'

const RUNNABLE_LANGS = new Set(['c', 'cpp'])

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsTrap(code) {
  for (const tv of TRAP_VARIABLES) {
    const re = new RegExp('\\b' + escapeRegex(tv) + '\\b')
    if (re.test(code)) {
      return tv
    }
  }
  return null
}

function hasTrapInComment(code, trapVar) {
  const escaped = escapeRegex(trapVar)
  const singleLine = new RegExp(`(//|#|--).*\\b${escaped}\\b`, 'i')
  if (singleLine.test(code)) return true
  const multiLine = new RegExp(`/\\*[\\s\\S]*?\\b${escaped}\\b[\\s\\S]*?\\*/`, 'i')
  if (multiLine.test(code)) return true
  return false
}

function runCpp(code, input) {
  let output = ''
  const config = {
    stdio: {
      write: (s) => { output += s },
    },
  }
  try {
    const exitCode = JSCPP.run(code, input, config)
    return { output, exitCode, error: null }
  } catch (err) {
    return { output, exitCode: -1, error: err.message || String(err) }
  }
}

const PRINT_PATTERNS = [
  { lang: 'python', regex: /print\s*\(\s*(.+?)\s*\)\s*$/m },
  { lang: 'cpp', regex: /cout\s*<<\s*(.+?)\s*(?:<<|;)\s*$/m },
  { lang: 'c', regex: /printf\s*\(\s*"[^"]*"\s*,\s*(.+?)\s*\)\s*;?\s*$/m },
  { lang: 'java', regex: /System\.out\.(?:print|println)\s*\(\s*(.+?)\s*\)\s*;?\s*$/m },
  { lang: 'javascript', regex: /console\.log\s*\(\s*(.+?)\s*\)\s*;?\s*$/m },
]

function extractPrintExpression(code) {
  for (const { regex } of PRINT_PATTERNS) {
    const m = code.match(regex)
    if (m) return m[1].trim()
  }
  return null
}

function isStringLiteral(expr) {
  return (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  )
}

function extractStringValue(expr) {
  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr.slice(1, -1)
  }
  if (expr.startsWith("'") && expr.endsWith("'")) {
    return expr.slice(1, -1)
  }
  if (expr.startsWith('`') && expr.endsWith('`')) {
    return expr.slice(1, -1)
  }
  return null
}

function evaluateExpression(expr, sampleInput) {
  let sanitized = expr.trim()

  if (isStringLiteral(sanitized)) {
    return extractStringValue(sanitized)
  }

  const values = sampleInput.trim().split(/\s+/).filter(Boolean)
  const varMap = {}
  let varIdx = 0
  sanitized = sanitized.replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
    if (/^\d+$/.test(match)) return match
    if (!varMap[match] && varIdx < values.length) {
      varMap[match] = values[varIdx++]
    }
    return varMap[match] !== undefined ? varMap[match] : match
  })

  sanitized = sanitized.replace(/[^0-9+\-*/().\s]/g, '').trim()
  if (!sanitized) return null

  try {
    const result = new Function('return (' + sanitized + ')')()
    if (typeof result === 'number' && !Number.isNaN(result)) {
      return String(result)
    }
    return String(result)
  } catch {
    return null
  }
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function judge(code, problem, language) {
  const trapVar = containsTrap(code)
  if (trapVar) {
    const commentedTrap = hasTrapInComment(code, trapVar)
    return {
      status: 'cheating',
      trapVariable: trapVar,
      trapInComment: commentedTrap,
      output: null,
      similarity: 0,
    }
  }

  if (RUNNABLE_LANGS.has(language)) {
    const result = runCpp(code, problem.sampleInput)
    const output = result.output.trim()

    if (result.error && !output) {
      return { status: 'wa', trapVariable: null, output: result.error, similarity: 0 }
    }

    const normalizedOutput = normalize(output)
    const normalizedExpected = normalize(problem.expectedOutput)

    if (normalizedOutput === normalizedExpected) {
      return { status: 'ac', trapVariable: null, output, similarity: 1 }
    }

    if (output) {
      const words = problem.expectedOutput.split(/\s+/)
      const matched = words.filter((w) => normalizedOutput.includes(normalize(w)))
      const similarity = words.length > 0 ? matched.length / words.length : 0
      return { status: 'wa', trapVariable: null, output, similarity }
    }

    return { status: 'wa', trapVariable: null, output: null, similarity: 0 }
  }

  const expr = extractPrintExpression(code)
  let output = null
  let similarity = 0

  if (expr) {
    const extracted = evaluateExpression(expr, problem.sampleInput)
    if (extracted !== null) {
      output = extracted
    }
  }

  if (output !== null) {
    const normalizedOutput = normalize(output)
    const normalizedExpected = normalize(problem.expectedOutput)
    if (normalizedOutput === normalizedExpected) {
      similarity = 1.0
      return { status: 'ac', trapVariable: null, output, similarity }
    }
    const words = problem.expectedOutput.split(/\s+/)
    const matched = words.filter((w) => normalizedOutput.includes(normalize(w)))
    similarity = words.length > 0 ? matched.length / words.length : 0
    return { status: 'wa', trapVariable: null, output, similarity }
  }

  const hints = problem.solutionHint || []
  const hintMatchCount = hints.filter((h) =>
    new RegExp('\\b' + escapeRegex(h) + '\\b', 'i').test(code)
  ).length
  if (hints.length > 0 && hintMatchCount >= Math.min(2, hints.length)) {
    similarity = 0.85
    return { status: 'ac', trapVariable: null, output: null, similarity }
  }

  if (hints.length > 0 && hintMatchCount > 0) {
    similarity = 0.5
  }

  return { status: 'wa', trapVariable: null, output: null, similarity }
}
