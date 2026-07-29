import { useParams, Link } from 'react-router-dom'
import { getSubmission, getSubmissions } from '../utils/storage'

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statusConfig = {
  ac: { icon: 'check-circle', label: 'Accepted', cls: 'status-ac', color: '#52c41a' },
  wa: { icon: 'times-circle', label: 'Wrong Answer', cls: 'status-wa', color: '#faad14' },
  cheating: { icon: 'exclamation-triangle', label: 'Cheating', cls: 'status-cheating', color: '#f5222d' },
}

function getPrevNext(id) {
  const subs = getSubmissions()
  const idx = subs.findIndex((s) => s.id === id)
  if (idx === -1) return {}
  return {
    prev: idx < subs.length - 1 ? subs[idx + 1] : null,
    next: idx > 0 ? subs[idx - 1] : null,
  }
}

export default function RecordDetail() {
  const { recordId } = useParams()
  const sub = getSubmission(recordId)
  const { prev, next } = getPrevNext(recordId)

  if (!sub) {
    return (
      <div className="page-container">
        <div className="not-found">
          <i className="fas fa-question-circle"></i>
          <h2>提交记录不存在</h2>
          <Link to="/record" className="btn-back">
            <i className="fas fa-arrow-left"></i>
            返回评测记录
          </Link>
        </div>
      </div>
    )
  }

  const cfg = statusConfig[sub.status] || statusConfig.wa

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <Link to="/record" className="header-back-link">
            <i className="fas fa-arrow-left"></i>
          </Link>
          评测详情
        </h2>
        <span className="detail-id-label">#{sub.id}</span>
      </div>

      <div className="submission-detail">
        <div className="detail-header">
          <h3>
            <i className={`fas fa-${cfg.icon}`} style={{ color: cfg.color }}></i>
            {cfg.label}
          </h3>
          <span className="detail-time">{formatTime(sub.timestamp)}</span>
        </div>

        <div className="detail-meta">
          <span>
            <i className="fas fa-book"></i>
            题目: <Link to={`/problem/${sub.problemId}`}>{sub.problemId} {sub.problemTitle}</Link>
          </span>
          <span>
            <i className="fas fa-code"></i>
            语言: {sub.language}
          </span>
          <span>
            <i className={`fas fa-${cfg.icon}`} style={{ color: cfg.color }}></i>
            状态: {cfg.label}
          </span>
          {sub.trapVariable && (
            <span className="detail-trap">
              <i className="fas fa-bug"></i>
              陷阱变量: <code>{sub.trapVariable}</code>
            </span>
          )}
          {sub.similarity !== undefined && sub.similarity > 0 && (
            <span>
              <i className="fas fa-chart-line"></i>
              相似度: {(sub.similarity * 100).toFixed(0)}%
            </span>
          )}
        </div>

        <div className="detail-code">
          <div className="detail-code-header">
            <i className="fas fa-file-code"></i>
            提交代码
          </div>
          <pre><code>{sub.code}</code></pre>
        </div>
      </div>

      <div className="detail-nav">
        {prev ? (
          <Link to={`/record/${prev.id}`} className="detail-nav-link prev">
            <i className="fas fa-chevron-left"></i>
            上一条
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/record/${next.id}`} className="detail-nav-link next">
            下一条
            <i className="fas fa-chevron-right"></i>
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
