import JSCPP from 'JSCPP'
import type { JudgeCaseResult, Problem, TestCase } from '../types'

const RUNNABLE_LANGS = new Set(['c', 'cpp', 'javascript'])

interface RunResult {
  output: string
  error: string | null
}

function runCpp(code: string, input: string): RunResult {
  let output = ''
  const config = {
    stdio: {
      write: (s: string) => { output += s },
    },
  }
  try {
    JSCPP.run(code, input, config)
    return { output, error: null }
  } catch (err) {
    return { output, error: (err as Error).message || String(err) }
  }
}

function runJs(code: string, input: string): RunResult {
  let output = ''
  const lines = input.split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  let inputIndex = 0
  const write = (...args: unknown[]) => {
    output += args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ') + '\n'
  }
  const readline = () => inputIndex < lines.length ? lines[inputIndex++] : undefined
  const exitSignal = {}
  const toString = (encoding = 'utf8') => {
    if (encoding !== 'ascii' && encoding !== 'utf8' && encoding !== 'utf-8') {
      throw new Error('仅支持 ascii 或 utf8 编码')
    }
    return input
  }
  const stdinBuffer = { toString }
  const process = { stdin: { read: readline }, exit: () => { throw exitSignal } }
  const fs = {
    readFileSync: (path: number | string, encoding?: string) => {
      if (path !== 0 && path !== '0' && path !== '/dev/stdin') throw new Error('仅支持读取标准输入（文件描述符 0 或 /dev/stdin）')
      return encoding === undefined ? stdinBuffer : toString(encoding)
    },
  }
  const require = (module: string) => {
    if (module !== 'fs') throw new Error("当前 JavaScript 运行时仅支持 require('fs')")
    return fs
  }
  const originalLog = console.log
  console.log = write
  try {
    const fn = new Function('input', 'readline', 'readLine', 'print', 'process', 'fs', 'require', `return (function () {
${code}
})()`) as (
      input: string,
      readline: () => string | undefined,
      readLine: () => string | undefined,
      print: (...args: unknown[]) => void,
      process: { stdin: { read: () => string | undefined }; exit: () => never },
      fs: { readFileSync: (path: number | string, encoding?: string) => string | { toString: (encoding?: string) => string } },
      require: (module: string) => typeof fs,
    ) => void
    fn(input, readline, readline, write, process, fs, require)
    return { output: output.trim(), error: null }
  } catch (err) {
    if (err === exitSignal) return { output: output.trim(), error: null }
    return { output: output.trim(), error: (err as Error).message || String(err) }
  } finally {
    console.log = originalLog
  }
}

const PRINT_PATTERNS: { lang: string; regex: RegExp }[] = [
  { lang: 'python', regex: /print\s*\(\s*(.+?)\s*\)\s*$/m },
  { lang: 'cpp', regex: /cout\s*<<\s*(.+?)\s*(?:<<|;)\s*$/m },
  { lang: 'c', regex: /printf\s*\(\s*"[^"]*"\s*,\s*(.+?)\s*\)\s*;?\s*$/m },
  { lang: 'java', regex: /System\.out\.(?:print|println)\s*\(\s*(.+?)\s*\)\s*;?\s*$/m },
  { lang: 'javascript', regex: /console\.log\s*\(\s*(.+?)\s*\)\s*;?\s*$/m },
]

function extractPrintExpression(code: string): string | null {
  for (const { regex } of PRINT_PATTERNS) {
    const m = code.match(regex)
    if (m) return m[1].trim()
  }
  return null
}

function isStringLiteral(expr: string): boolean {
  return (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  )
}

function extractStringValue(expr: string): string | null {
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

function evaluateExpression(expr: string, sampleInput: string): string | null {
  let sanitized = expr.trim()

  if (isStringLiteral(sanitized)) {
    return extractStringValue(sanitized)
  }

  const values = sampleInput.trim().split(/\s+/).filter(Boolean)
  const varMap: Record<string, string> = {}
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
    const result = new Function('return (' + sanitized + ')')() as unknown
    return String(result)
  } catch {
    return null
  }
}

export function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function runOnce(runner: (code: string, input: string) => RunResult, code: string, input: string): { output: string; error: string | null } {
  const result = runner(code, input)
  return { output: result.output.trim(), error: result.error }
}

export function judgeTestCase(code: string, language: string, tc: TestCase): JudgeCaseResult {
  if (!RUNNABLE_LANGS.has(language)) {
    const expr = extractPrintExpression(code)
    const output = expr ? evaluateExpression(expr, tc.input) : null
    const passed = output !== null && normalize(output) === normalize(tc.output)
    return {
      input: tc.input,
      expected: tc.output,
      actual: output,
      passed,
      error: false,
    }
  }

  const runner = language === 'javascript' ? runJs : runCpp
  const result = runOnce(runner, code, tc.input)
  if (result.error && !result.output) {
    return {
      input: tc.input,
      expected: tc.output,
      actual: result.error,
      passed: false,
      error: true,
    }
  }
  return {
    input: tc.input,
    expected: tc.output,
    actual: result.output,
    passed: normalize(result.output) === normalize(tc.output),
    error: false,
  }
}

export interface JudgeVerdict {
  status: 'ac' | 'wa'
  output: string | null
  similarity: number
  testResults?: (JudgeCaseResult & { durationMs: number })[]
  passedTests?: number
  totalTests?: number
}

export function judge(code: string, problem: Problem, language: string): JudgeVerdict {
  if (RUNNABLE_LANGS.has(language)) {
    const runner = language === 'javascript' ? runJs : runCpp

    const tcs = problem.testCases || [{ input: problem.sampleInput, output: problem.expectedOutput }]
    const testResults: (JudgeCaseResult & { durationMs: number })[] = []

    for (const tc of tcs) {
      const startedAt = performance.now()
      const r = judgeTestCase(code, language, tc)
      const durationMs = performance.now() - startedAt
      testResults.push({
        ...r,
        durationMs,
      })
      if (r.error) break
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
  let output: string | null = null
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
