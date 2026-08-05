export type LanguageId = 'c' | 'cpp' | 'cpp-wasm' | 'python-wasm' | 'python-brython' | 'javascript' | 'wenyan'

export type SubmissionStatus = 'compiling' | 'running' | 'ac' | 'wa' | 'tle' | 'error'

export type TestResultStatus = 'pending' | 'running' | 'passed' | 'failed' | 'timeout' | 'error' | 'skipped'

export interface TestCase {
  input: string
  output: string
}

export interface TestResult {
  input: string
  expected: string
  actual: string | null
  passed: boolean
  error: boolean
  timeout?: boolean
  status: TestResultStatus
  durationMs: number | null
}

export interface Problem {
  id: string
  title: string
  difficulty: string
  timeLimit: number
  description: string
  sampleInput: string
  expectedOutput: string
  testCases: TestCase[]
}

export type ArticleCategory =
  | 'solutions'
  | 'tech-engineering'
  | 'algo-theory'
  | 'life-travel'
  | 'academics'
  | 'entertainment'

export interface Article {
  id: string
  title: string
  category: ArticleCategory
  date: string
  author: string
  tags: string[]
  problemId?: string
  summary?: string
  content: string
}

export interface Submission {
  id: string
  timestamp: number
  problemId: string
  problemTitle: string
  code: string
  language: LanguageId
  status: SubmissionStatus
  timeLimit?: number
  testResults?: TestResult[]
  passedTests?: number
  totalTests?: number
  output?: string | null
  similarity?: number
}

export interface SubmissionUpdates {
  status?: SubmissionStatus
  testResults?: TestResult[]
  passedTests?: number
  totalTests?: number
  output?: string | null
  similarity?: number
}

export type SubmissionStatusKey = SubmissionStatus

export interface RunOutput {
  output: string
  error: boolean
  timeout?: boolean
  detail?: string
  durationMs: number
}

export interface CompileError {
  phase: 'compile' | 'link'
  message: string
  detail: string
}

export interface ProgressInfo {
  loaded: number
  total: number
  fileName: string | null
  fileLoaded: number
  fileTotal: number
}

export type WorkerRequest = {
  code: string
  language: string
  testCase: TestCase
}

export type WorkerResponse =
  | { type: 'result'; result: JudgeCaseResult }
  | { type: 'error'; error: string }

export interface JudgeCaseResult {
  input: string
  expected: string
  actual: string | null
  passed: boolean
  error: boolean
  timeout?: boolean
}
