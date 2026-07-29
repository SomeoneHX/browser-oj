function resolveResult(result) {
  if (result.status === 'cheating') {
    return { ...result, status: 'wa' }
  }
  return result
}

export default function ResultCard({ result, problem }) {
  if (!result) return null

  const r = resolveResult(result)

  if (r.status === 'ac') {
    return (
      <div className="result-card result-ac">
        <div className="result-header">
          <i className="fas fa-check-circle result-icon"></i>
          <span className="result-label">通过</span>
        </div>
        <div className="result-body">
          {r.output !== null ? (
            <p><i className="fas fa-terminal"></i> 输出匹配: <code>{r.output}</code></p>
          ) : (
            <p><i className="fas fa-check"></i> 代码结构符合题目要求</p>
          )}
          {r.similarity < 1 && (
            <p className="result-note">相似度: {(r.similarity * 100).toFixed(0)}%</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="result-card result-wa">
      <div className="result-header">
        <i className="fas fa-times-circle result-icon"></i>
        <span className="result-label">未通过</span>
      </div>
      <div className="result-body">
        {r.output !== null ? (
          <p><i className="fas fa-terminal"></i> 你的输出: <code>{r.output}</code></p>
        ) : (
          <p><i className="fas fa-code"></i> 无法提取输出内容</p>
        )}
        <p><i className="fas fa-check-double"></i> 期望输出: <code>{problem.expectedOutput}</code></p>
        {r.similarity > 0 && r.similarity < 1 && (
          <p className="result-note">部分匹配: {(r.similarity * 100).toFixed(0)}%</p>
        )}
      </div>
    </div>
  )
}
