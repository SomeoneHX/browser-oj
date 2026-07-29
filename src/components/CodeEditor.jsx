import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { javascript } from '@codemirror/lang-javascript'

const LANGUAGES = [
  { id: 'c', label: 'C (JSCPP)', ext: cpp },
  { id: 'cpp', label: 'C++ (JSCPP)', ext: cpp },
  { id: 'javascript', label: 'JavaScript', ext: javascript },
]

export default function CodeEditor({ value, onChange, language, onLanguageChange }) {
  const handleLangChange = (e) => {
    onLanguageChange(e.target.value)
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
