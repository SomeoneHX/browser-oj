import { useState, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { problems } from '../data/problems'
import { addSubmission, getSubmissions } from '../utils/storage'
import { startJudge } from '../utils/judgeManager'
import ProblemRenderer from '../components/ProblemRenderer'
import CodeEditor from '../components/CodeEditor'

export default function ProblemDetail() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const problem = problems.find((p) => p.id === problemId)

  const lastSub = useMemo(() => {
    const subs = getSubmissions()
    for (const s of subs) {
      if (s.problemId === problemId) return s
    }
    return null
  }, [problemId])

  const [code, setCode] = useState(lastSub ? lastSub.code : '')
  const [language, setLanguage] = useState(lastSub ? lastSub.language : 'cpp')
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!problem) return
    try {
      await navigator.clipboard.writeText(problem.description)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = problem.description
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [problem])

  const handleSubmit = () => {
    if (!code.trim() || !problem) return
    const submission = addSubmission({
      problemId: problem.id,
      problemTitle: problem.title,
      code,
      language,
      status: 'running',
      timeLimit: problem.timeLimit,
      testResults: problem.testCases.map((testCase) => ({
        input: testCase.input,
        expected: testCase.output,
        actual: null,
        passed: false,
        status: 'pending',
        durationMs: null,
      })),
      passedTests: 0,
      totalTests: problem.testCases.length,
    })

    navigate(`/record/${submission.id}`)
    void startJudge(submission, problem)
  }

  if (!problem) {
    return (
      <div className="page-container">
        <div className="not-found">
          <i className="fas fa-question-circle"></i>
          <h2>题目不存在</h2>
          <Link to="/problems" className="btn-back">
            <i className="fas fa-arrow-left"></i>
            返回题目列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container problem-detail-page">
      <div className="problem-header">
        <div className="problem-meta">
          <h2>
            <span className="problem-id">{problem.id}</span>
            {problem.title}
          </h2>
          <span className={`tag ${
            problem.difficulty === '简单' ? 'tag-easy' :
            problem.difficulty === '中等' ? 'tag-medium' : 'tag-hard'
          }`}>
            {problem.difficulty}
          </span>
          <span className="problem-time-limit">
            <i className="fas fa-stopwatch"></i>
            {problem.timeLimit} ms / 测试点
          </span>
        </div>
        <button className="btn-copy" onClick={handleCopy}>
          <i className={`fas fa-${copied ? 'check' : 'clipboard'}`}></i>
          {copied ? '已复制' : '复制题目'}
        </button>
      </div>

      <div className="problem-layout">
        <div className="problem-left">
          <ProblemRenderer description={problem.description} />
        </div>
        <div className="problem-right">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
          />
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={!code.trim()}
          >
            <><i className="fas fa-paper-plane"></i> 提交评测</>
          </button>
        </div>
      </div>
    </div>
  )
}
