import { useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { problems } from '../data/problems'
import { judge } from '../utils/judge'
import { addSubmission, updateStats, getStats, unlockAchievement, getAchievements } from '../utils/storage'
import { checkAchievements } from '../utils/achievements'
import ProblemRenderer from '../components/ProblemRenderer'
import CodeEditor from '../components/CodeEditor'

export default function ProblemDetail() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const problem = problems.find((p) => p.id === problemId)

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('cpp')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!problem) return
    try {
      await navigator.clipboard.writeText(problem.plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = problem.plainText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [problem])

  const handleSubmit = () => {
    if (!code.trim() || submitting || !problem) return
    setSubmitting(true)

    const judgeResult = judge(code, problem, language)

    const stats = getStats()
    const newStats = { ...stats }
    newStats.totalSubmissions += 1

    if (judgeResult.status === 'cheating') {
      newStats.cheatingCount = (stats.cheatingCount || 0) + 1
      newStats.consecutiveAC = 0
      newStats.lastStatus = 'cheating'
      if (!newStats.cheatedProblems) newStats.cheatedProblems = []
      if (!newStats.cheatedProblems.includes(problem.id)) {
        newStats.cheatedProblems = [...newStats.cheatedProblems, problem.id]
      }
      if (judgeResult.trapInComment) {
        newStats.commentedTrapCount = (stats.commentedTrapCount || 0) + 1
      }
    } else if (judgeResult.status === 'ac') {
      newStats.acCount = (stats.acCount || 0) + 1
      newStats.consecutiveAC = (stats.consecutiveAC || 0) + 1
      newStats.longestACStreak = Math.max(
        newStats.consecutiveAC,
        stats.longestACStreak || 0
      )
      newStats.lastStatus = 'ac'
    } else {
      newStats.waCount = (stats.waCount || 0) + 1
      newStats.consecutiveAC = 0
      newStats.lastStatus = 'wa'
    }

    updateStats(newStats)

    const submission = addSubmission({
      problemId: problem.id,
      problemTitle: problem.title,
      code,
      language,
      status: judgeResult.status,
      trapVariable: judgeResult.trapVariable,
      similarity: judgeResult.similarity,
    })

    const newUnlocks = checkAchievements(newStats)
    const currentAch = getAchievements()
    newUnlocks.forEach((id) => {
      if (!currentAch[id]) {
        unlockAchievement(id)
      }
    })

    navigate(`/record/${submission.id}`)
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
            disabled={!code.trim() || submitting}
          >
            {submitting ? (
              <><i className="fas fa-spinner fa-spin"></i> 评测中...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> 提交评测</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
