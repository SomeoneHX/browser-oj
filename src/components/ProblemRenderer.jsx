import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ProblemRenderer({ description }) {
  return (
    <div className="problem-description">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {description}
      </ReactMarkdown>
    </div>
  )
}
