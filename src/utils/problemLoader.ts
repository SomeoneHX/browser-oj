import type { Problem, TestCase } from '../types'

function loadProblems(): Problem[] {
  const mdModules = import.meta.glob<string>('/problems/*/problem.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  const tcModules = import.meta.glob<string>('/problems/*/testcases/*.{in,out}', {
    eager: true,
    query: '?raw',
    import: 'default',
  })

  const problemIds = new Set<string>()
  for (const key of Object.keys(mdModules)) {
    const match = key.match(/\/problems\/([^/]+)\/problem\.md/)
    if (match) problemIds.add(match[1])
  }

  const problems: Problem[] = []
  for (const id of problemIds) {
    const source = mdModules[`/problems/${id}/problem.md`] || ''
    const frontMatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
    const metadata = frontMatterMatch?.[1] || ''
    const description = frontMatterMatch?.[2]?.trim() || source
    const title = metadata.match(/^title:\s*(.+)$/m)?.[1]?.trim() || id
    const difficulty = metadata.match(/^difficulty:\s*(.+)$/m)?.[1]?.trim() || '简单'
    const timeLimit = Number(metadata.match(/^timeLimit:\s*(\d+)$/m)?.[1] || 2000)

    const testCaseKeys = Object.keys(tcModules).filter(
      (k) => k.startsWith(`/problems/${id}/testcases/`) && k.endsWith('.in'),
    )
    const testCases: TestCase[] = testCaseKeys
      .map((inkey) => {
        const base = inkey.replace(/\.in$/, '')
        const outkey = base + '.out'
        return {
          input: (tcModules[inkey] || '').trim(),
          output: (tcModules[outkey] || '').trim(),
        }
      })
      .filter((tc) => tc.output !== '')

    problems.push({
      id,
      title,
      difficulty,
      timeLimit,
      description,
      sampleInput: testCases[0]?.input || '',
      expectedOutput: testCases[0]?.output || '',
      testCases: testCases.length > 0 ? testCases : [{ input: '', output: '' }],
    })
  }

  problems.sort((a, b) => a.id.localeCompare(b.id))
  return problems
}

export const problems = loadProblems()
