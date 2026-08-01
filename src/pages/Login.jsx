import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setNickname } from '../utils/storage'

const API_BASE = 'https://api.luogu.me'
const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 30

function createVerificationCode() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const values = new Uint32Array(12)
  crypto.getRandomValues(values)
  return `browser-oj-${Array.from(values, (value) => alphabet[value % alphabet.length]).join('')}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestJson(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'Browser-OJ',
      ...(options?.headers || {}),
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body || body.code !== 200) {
    throw new Error(body?.message || `请求失败（${response.status}）`)
  }
  return body
}

export default function Login({ onLogin }) {
  const [verificationCode] = useState(createVerificationCode)
  const [pasteId, setPasteId] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedPasteId = pasteId.trim()
    if (!trimmedPasteId || verifying) return

    setVerifying(true)
    setError('')
    setStatus('正在同步洛谷剪贴板...')

    try {
      const workflow = await requestJson(`${API_BASE}/workflow/create/template/paste-save-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: trimmedPasteId }),
      })
      const workflowId = workflow.data?.workflowId
      if (!workflowId) throw new Error('同步任务创建失败')

      let workflowData = null
      let saveCompleted = false
      for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
        if (attempt > 0) await sleep(POLL_INTERVAL_MS)
        const result = await requestJson(`${API_BASE}/workflow/query/${encodeURIComponent(workflowId)}`)
        workflowData = result.data
        setStatus(`正在同步洛谷剪贴板... (${attempt + 1}/${MAX_POLLS})`)

        const saveTask = workflowData?.tasks?.find((task) => task.taskName === 'save' || task.type === 'save')
        if (saveTask?.status === 'completed') {
          saveCompleted = true
          break
        }
        if (saveTask && ['failed', 'cancelled', 'canceled', 'error'].includes(saveTask.status)) {
          throw new Error('洛谷剪贴板同步失败')
        }
        if (['failed', 'cancelled', 'canceled', 'error'].includes(workflowData?.status)) {
          throw new Error('洛谷剪贴板同步失败')
        }
      }

      if (!saveCompleted) {
        throw new Error('洛谷剪贴板同步超时，请稍后重试')
      }

      setStatus('正在验证剪贴板内容...')
      const paste = await requestJson(`${API_BASE}/paste/query/${encodeURIComponent(trimmedPasteId)}`)
      const pasteData = paste.data
      const nickname = pasteData?.author?.name
      if (pasteData?.deleted) throw new Error('这个洛谷剪贴板已被删除')
      if (pasteData?.content?.trim() !== verificationCode) {
        throw new Error('剪贴板内容与验证文本不一致')
      }
      if (!nickname) throw new Error('未能获取洛谷用户名')

      setNickname(nickname)
      if (onLogin) onLogin()
      navigate('/problems', { replace: true })
    } catch (err) {
      setStatus('')
      setError(err.message || '登录验证失败，请重试')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <i className="fas fa-code login-icon"></i>
          <h1>Browser OJ</h1>
          <p className="login-subtitle">使用洛谷剪贴板登录</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-instructions">
            <p>1. 将下面的验证文本完整写入一个洛谷剪贴板。</p>
            <code>{verificationCode}</code>
            <p>2. 输入洛谷剪贴板 ID，系统会同步并验证剪贴板作者。</p>
          </div>
          <div className="login-field">
            <i className="fas fa-paste"></i>
            <input
              type="text"
              placeholder="输入洛谷剪贴板 ID"
              value={pasteId}
              onChange={(e) => setPasteId(e.target.value)}
              maxLength={64}
              autoFocus
            />
          </div>
          {status && <p className="login-status"><i className="fas fa-spinner fa-spin"></i>{status}</p>}
          {error && <p className="login-error"><i className="fas fa-circle-exclamation"></i>{error}</p>}
          <button type="submit" className="btn-login" disabled={!pasteId.trim() || verifying}>
            <i className={verifying ? 'fas fa-spinner fa-spin' : 'fas fa-sign-in-alt'}></i>
            {verifying ? '验证中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
