import JSCPP from 'JSCPP'

const RUNNABLE_LANGS = new Set(['c', 'cpp', 'javascript'])

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

function runJs(code, input) {
  let output = ''
  const originalLog = console.log
  console.log = (...args) => {
    output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n'
  }
  try {
    const fn = new Function('input', code)
    fn(input)
    return { output: output.trim(), error: null }
  } catch (err) {
    return { output: output.trim(), error: err.message || String(err) }
  } finally {
    console.log = originalLog
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

function runOnce(runner, code, input) {
  const result = runner(code, input)
  return { output: result.output.trim(), error: result.error }
}

export function judge(code, problem, language) {
  if (RUNNABLE_LANGS.has(language)) {
    const runner = language === 'javascript' ? runJs : runCpp

    const tcs = problem.testCases || [{ input: problem.sampleInput, output: problem.expectedOutput }]
    const testResults = []

    for (const tc of tcs) {
      const startedAt = performance.now()
      const r = runOnce(runner, code, tc.input)
      const durationMs = performance.now() - startedAt
      if (r.error && !r.output) {
        testResults.push({
          input: tc.input,
          expected: tc.output,
          actual: r.error,
          passed: false,
          error: true,
          durationMs,
        })
        break
      }
      const passed = normalize(r.output) === normalize(tc.output)
      testResults.push({
        input: tc.input,
        expected: tc.output,
        actual: r.output,
        passed,
        durationMs,
      })
    }

    const total = tcs.length
    const passed = testResults.filter((r) => r.passed).length
    const hasError = testResults.some((r) => r.error)
    const firstFail = testResults.find((r) => !r.passed)

    if (passed === total && !hasError) {
      return {
        status: 'ac',
        output: null,
        similarity: 1,
        testResults,
        passedTests: passed,
        totalTests: total,
      }
    }

    return {
      status: 'wa',
      output: firstFail?.error ? firstFail.actual : firstFail?.actual || '未通过',
      similarity: total > 0 ? passed / total : 0,
      testResults,
      passedTests: passed,
      totalTests: total,
    }
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
      return { status: 'ac', output, similarity }
    }
    const words = problem.expectedOutput.split(/\s+/)
    const matched = words.filter((w) => normalizedOutput.includes(normalize(w)))
    similarity = words.length > 0 ? matched.length / words.length : 0
    return { status: 'wa', output, similarity }
  }

  return { status: 'wa', output: null, similarity }
}
