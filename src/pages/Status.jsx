import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSubmissions } from '../utils/storage'

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statusConfig = {
  ac: { icon: 'check-circle', label: 'Accepted', cls: 'status-ac' },
  wa: { icon: 'times-circle', label: 'Wrong Answer', cls: 'status-wa' },
  cheating: { icon: 'exclamation-triangle', label: 'Cheating', cls: 'status-cheating' },
}

export default function Status() {
  const [submissions] = useState(() => getSubmissions())
  const [expanded, setExpanded] = useState(null)

  if (submissions.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2><i className="fas fa-history"></i> 提交记录</h2>
        </div>
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>暂无提交记录</p>
          <Link to="/problems" className="btn-back">
            <i className="fas fa-arrow-left"></i>
            去答题
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><i className="fas fa-history"></i> 提交记录</h2>
        <span className="problem-count">共 {submissions.length} 条</span>
      </div>
      <div className="table-wrapper">
        <table className="submission-table">
          <thead>
            <tr>
              <th className="col-time">时间</th>
              <th className="col-problem">题目</th>
              <th className="col-lang">语言</th>
              <th className="col-status-text">状态</th>
              <th className="col-action">详情</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => {
              const cfg = statusConfig[sub.status] || statusConfig.wa
              return (
                <tr key={sub.id}>
                  <td className="col-time">{formatTime(sub.timestamp)}</td>
                  <td className="col-problem">
                    <Link to={`/problem/${sub.problemId}`}>
                      {sub.problemId} {sub.problemTitle}
                    </Link>
                  </td>
                  <td className="col-lang">{sub.language}</td>
                  <td className="col-status-text">
                    <span className={`status-badge ${cfg.cls}`}>
                      <i className={`fas fa-${cfg.icon}`}></i>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="col-action">
                    <button
                      className="btn-detail"
                      onClick={() =>
                        setExpanded(expanded === sub.id ? null : sub.id)
                      }
                    >
                      <i className={`fas fa-${expanded === sub.id ? 'chevron-up' : 'chevron-down'}`}></i>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {expanded && (() => {
        const sub = submissions.find((s) => s.id === expanded)
        if (!sub) return null
        const cfg = statusConfig[sub.status] || statusConfig.wa
        return (
          <div className="submission-detail">
            <div className="detail-header">
              <h3>
                <i className={`fas fa-${cfg.icon}`} style={{ color: cfg.cls.includes('ac') ? '#52c41a' : cfg.cls.includes('cheating') ? '#f5222d' : '#faad14' }}></i>
                提交详情
              </h3>
              <span className="detail-id">#{sub.id}</span>
            </div>
            <div className="detail-meta">
              <span>题目: {sub.problemId} {sub.problemTitle}</span>
              <span>语言: {sub.language}</span>
              <span>状态: {cfg.label}</span>
              {sub.trapVariable && (
                <span className="detail-trap">
                  <i className="fas fa-bug"></i>
                  陷阱变量: {sub.trapVariable}
                </span>
              )}
              {sub.similarity !== undefined && sub.similarity > 0 && (
                <span>相似度: {(sub.similarity * 100).toFixed(0)}%</span>
              )}
            </div>
            <div className="detail-code">
              <pre><code>{sub.code}</code></pre>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
