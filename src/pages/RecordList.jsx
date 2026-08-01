import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSubmissions } from '../utils/storage'

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function displayStatus(sub) {
  if (sub.status === 'running') {
    return { icon: 'spinner fa-spin', label: '评测中', cls: 'status-running' }
  }
  if (sub.status === 'tle') {
    return { icon: 'clock', label: '超时', cls: 'status-tle' }
  }
  if (sub.status === 'error') {
    return { icon: 'exclamation-circle', label: '运行错误', cls: 'status-tle' }
  }
  if (sub.status === 'ac') {
    return { icon: 'check-circle', label: '通过', cls: 'status-ac' }
  }
  return { icon: 'times-circle', label: '未通过', cls: 'status-wa' }
}

export default function RecordList() {
  const [submissions] = useState(() => getSubmissions())

  if (submissions.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2><i className="fas fa-history"></i> 评测记录</h2>
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
        <h2><i className="fas fa-history"></i> 评测记录</h2>
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
              const cfg = displayStatus(sub)
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
                    <Link to={`/record/${sub.id}`} className="btn-detail">
                      <i className="fas fa-chevron-right"></i>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
