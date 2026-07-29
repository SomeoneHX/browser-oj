function loadProblems() {
  const metaModules = import.meta.glob('/problems/*/meta.json', { eager: true })
  const mdModules = import.meta.glob('/problems/*/problem.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  const tcModules = import.meta.glob('/problems/*/testcases/*.{in,out}', {
    eager: true,
    query: '?raw',
    import: 'default',
  })

  const problemIds = new Set()
  for (const key of Object.keys(metaModules)) {
    const match = key.match(/\/problems\/([^/]+)\/meta\.json/)
    if (match) problemIds.add(match[1])
  }

  const problems = []
  for (const id of problemIds) {
    const meta = metaModules[`/problems/${id}/meta.json`]?.default || {}
    const description = mdModules[`/problems/${id}/problem.md`]?.default || ''

    const testCaseKeys = Object.keys(tcModules).filter(
      (k) => k.startsWith(`/problems/${id}/testcases/`) && k.endsWith('.in')
    )
    const testCases = testCaseKeys
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
      title: meta.title || id,
      difficulty: meta.difficulty || '简单',
      description,
      plainText: meta.plainText || '',
      trapVariable: meta.trapVariable || null,
      sampleInput: testCases[0]?.input || '',
      expectedOutput: testCases[0]?.output || '',
      testCases: testCases.length > 0 ? testCases : [{ input: '', output: '' }],
    })
  }

  problems.sort((a, b) => a.id.localeCompare(b.id))
  return problems
}

export const problems = loadProblems()

export const TRAP_VARIABLES = problems
  .map((p) => p.trapVariable)
  .filter(Boolean)
