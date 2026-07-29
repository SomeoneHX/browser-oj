import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'

const LANGUAGES = [
  { id: 'c', label: 'C (GCC)', ext: cpp },
  { id: 'cpp', label: 'C++ (G++)', ext: cpp },
  { id: 'java', label: 'Java', ext: java },
  { id: 'python', label: 'Python 3', ext: python },
  { id: 'javascript', label: 'JavaScript (Node.js)', ext: javascript },
]

const DEFAULT_CODE = {
  c: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
  python: '',
  javascript: '',
}

export default function CodeEditor({ value, onChange, language, onLanguageChange }) {
  const handleLangChange = (e) => {
    const newLang = e.target.value
    onLanguageChange(newLang)
    const defaultCode = DEFAULT_CODE[newLang] || ''
    onChange(defaultCode)
  }

  const currentExt = LANGUAGES.find((l) => l.id === language)
  const ext = currentExt ? currentExt.ext() : cpp()

  return (
    <div className="code-editor-panel">
      <div className="editor-toolbar">
        <div className="editor-lang-select">
          <i className="fas fa-code"></i>
          <select value={language} onChange={handleLangChange}>
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="editor-container">
        <CodeMirror
          value={value}
          height="420px"
          extensions={[ext]}
          onChange={(val) => onChange(val)}
          theme="light"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
          }}
        />
      </div>
    </div>
  )
}
