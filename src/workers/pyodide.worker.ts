import type { PyodideAPI } from 'pyodide'

const scope = self as unknown as DedicatedWorkerGlobalScope
let runtime: Promise<PyodideAPI> | null = null

function getRuntime(indexURL: string) {
  if (!runtime) {
    runtime = import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)
      .then(({ loadPyodide }) => loadPyodide({ indexURL }))
  }
  return runtime
}

type Request = { type: 'prepare'; id: number; indexURL: string } | { type: 'run'; id: number; code: string; input: string; indexURL: string }

scope.onmessage = async (event: MessageEvent<Request>) => {
  const { id, indexURL } = event.data
  if (event.data.type === 'prepare') {
    try {
      await getRuntime(indexURL)
      scope.postMessage({ id, type: 'ready' })
    } catch (caught) {
      scope.postMessage({ id, type: 'ready', error: (caught as Error).message || String(caught) })
    }
    return
  }
  const { code, input } = event.data
  let output = ''
  let error = ''
  try {
    const pyodide = await getRuntime(indexURL)
    const lines = input.split(/\n/)
    let inputIndex = 0
    pyodide.setStdin({ stdin: () => inputIndex < lines.length ? lines[inputIndex++] : null })
    pyodide.setStdout({ batched: (text) => { output += text } })
    pyodide.setStderr({ batched: (text) => { error += text } })
    const dict = pyodide.globals.get('dict')
    const globals = dict()
    dict.destroy()
    try {
      await pyodide.runPythonAsync(code, { globals })
    } finally {
      globals.destroy()
    }
    scope.postMessage({ id, output: output.trim(), error: error.trim() || undefined })
  } catch (caught) {
    scope.postMessage({ id, output: output.trim(), error: error.trim() || (caught as Error).message || String(caught) })
  }
}
