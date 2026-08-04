import type { LanguageId } from '../types'

export const LANGUAGES: { id: LanguageId; label: string }[] = [
  { id: 'c', label: 'C (JSCPP)' },
  { id: 'cpp', label: 'C++ (JSCPP)' },
  { id: 'cpp-wasm', label: 'C++ (WASM)' },
  { id: 'python-wasm', label: 'Python (WASM)' },
  { id: 'python-brython', label: 'Python (Brython)' },
  { id: 'javascript', label: 'JavaScript' },
]

export const LANGUAGE_LABELS: Record<LanguageId, string> = Object.fromEntries(LANGUAGES.map((item) => [item.id, item.label])) as Record<LanguageId, string>

export const WASM_LANGUAGE: LanguageId = 'cpp-wasm'
export const PYTHON_WASM_LANGUAGE: LanguageId = 'python-wasm'
export const PYTHON_BRYTHON_LANGUAGE: LanguageId = 'python-brython'
