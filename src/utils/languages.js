export const LANGUAGES = [
  { id: 'c', label: 'C (JSCPP)' },
  { id: 'cpp', label: 'C++ (JSCPP)' },
  { id: 'cpp-wasm', label: 'C++ (WASM)' },
  { id: 'javascript', label: 'JavaScript' },
]

export const LANGUAGE_LABELS = Object.fromEntries(LANGUAGES.map((item) => [item.id, item.label]))

export const WASM_LANGUAGE = 'cpp-wasm'
