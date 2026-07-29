import { Link } from 'react-router-dom'
import { problems } from '../data/problems'
import { getSubmissions } from '../utils/storage'

function calcPassRate(problemId) {
  const subs = getSubmissions().filter((s) => s.problemId === problemId)
  if (subs.length === 0) return null
  const ac = subs.filter((s) => s.status === 'ac').length
  return (ac / subs.length) * 100
}

function getMyStatus(problemId) {
  const subs = getSubmissions().filter((s) => s.problemId === problemId)
  if (subs.length === 0) return null
  const latest = subs[0]
  return latest.status
}

const difficultyMap = {
  '简单': 'tag-easy',
  '中等': 'tag-medium',
  '困难': 'tag-hard',
}

export default function ProblemList() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2><i className="fas fa-list"></i> 题目列表</h2>
        <span className="problem-count">共 {problems.length} 题</span>
      </div>
      <div className="table-wrapper">
        <table className="problem-table">
          <thead>
            <tr>
              <th className="col-id">#</th>
              <th className="col-title">题目名称</th>
              <th className="col-diff">难度</th>
              <th className="col-rate">通过率</th>
              <th className="col-status">我的状态</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => {
              const rate = calcPassRate(p.id)
              const myStatus = getMyStatus(p.id)
              return (
                <tr key={p.id}>
                  <td className="col-id">
                    <Link to={`/problem/${p.id}`} className="problem-link">
                      {p.id}
                    </Link>
                  </td>
                  <td className="col-title">
                    <Link to={`/problem/${p.id}`} className="problem-link">
                      {p.title}
                    </Link>
                  </td>
                  <td className="col-diff">
                    <span className={`tag ${difficultyMap[p.difficulty] || ''}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="col-rate">
                    {rate !== null ? `${rate.toFixed(0)}%` : '-'}
                  </td>
                  <td className="col-status">
                    {myStatus ? (
                      <span className={`status-badge ${myStatus === 'ac' ? 'status-ac' : 'status-wa'}`}>
                        <i className={`fas fa-${myStatus === 'ac' ? 'check-circle' : 'times-circle'}`}></i>
                        {myStatus === 'ac' ? '通过' : '未通过'}
                      </span>
                    ) : (
                      <span className="status-none">-</span>
                    )}
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
