export default function ResultCard({ result, problem }) {
  if (!result) return null

  const config = {
    ac: {
      icon: 'check-circle',
      label: 'Accepted',
      className: 'result-ac',
    },
    wa: {
      icon: 'times-circle',
      label: 'Wrong Answer',
      className: 'result-wa',
    },
    cheating: {
      icon: 'exclamation-triangle',
      label: 'Cheating Detected',
      className: 'result-cheating',
    },
  }

  const cfg = config[result.status] || config.wa

  return (
    <div className={`result-card ${cfg.className}`}>
      <div className="result-header">
        <i className={`fas fa-${cfg.icon} result-icon`}></i>
        <span className="result-label">{cfg.label}</span>
      </div>
      <div className="result-body">
        {result.status === 'cheating' && (
          <div className="result-detail">
            <p>
              <i className="fas fa-bug"></i>
              检测到陷阱变量: <code>{result.trapVariable}</code>
            </p>
            {result.trapInComment && (
              <p className="result-note">
                <i className="fas fa-comment"></i>
                陷阱变量位于注释中 — 你发现了隐藏文字！
              </p>
            )}
          </div>
        )}
        {result.status === 'ac' && (
          <div className="result-detail">
            {result.output !== null ? (
              <p>
                <i className="fas fa-terminal"></i>
                输出匹配: <code>{result.output}</code>
              </p>
            ) : (
              <p>
                <i className="fas fa-check"></i>
                代码结构符合题目要求
              </p>
            )}
            {result.similarity < 1 && (
              <p className="result-note">
                相似度: {(result.similarity * 100).toFixed(0)}%
              </p>
            )}
          </div>
        )}
        {result.status === 'wa' && (
          <div className="result-detail">
            {result.output !== null ? (
              <p>
                <i className="fas fa-terminal"></i>
                你的输出: <code>{result.output}</code>
              </p>
            ) : (
              <p>
                <i className="fas fa-code"></i>
                无法提取输出内容，请检查代码
              </p>
            )}
            <p>
              <i className="fas fa-check-double"></i>
              期望输出: <code>{problem.expectedOutput}</code>
            </p>
            {result.similarity > 0 && (
              <p className="result-note">
                部分匹配: {(result.similarity * 100).toFixed(0)}%
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
