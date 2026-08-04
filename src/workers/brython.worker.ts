declare const brython: (options?: Record<string, unknown>) => void
declare const __BRYTHON__: { runPythonSource: (source: string, options: { id: string }) => unknown }

const scope = self as unknown as DedicatedWorkerGlobalScope
let runId = 0

scope.onmessage = (event: MessageEvent<{ type: 'prepare'; prefix: string } | { type: 'run'; code: string; input: string }>) => {
  if (event.data.type === 'prepare') {
    try {
      importScripts(`${event.data.prefix}brython.js`, `${event.data.prefix}brython_stdlib.js`)
      brython({ debug: 0, cache: true, indexeddb: false })
      scope.postMessage({ type: 'ready' })
    } catch (error) {
      scope.postMessage({ type: 'ready', error: (error as Error).message || String(error) })
    }
    return
  }
  let output = ''
  try {
    const input = event.data.input.split(/\n/)
    const harness = `import sys\nclass _Stream:\n    def write(self, text):\n        global _browser_oj_output\n        _browser_oj_output += str(text)\n    def flush(self):\n        pass\n_browser_oj_output = ''\n_browser_oj_error = False\n_browser_oj_input = ${JSON.stringify(input)}\ndef input(prompt=''):\n    if not _browser_oj_input:\n        raise EOFError('EOF when reading a line')\n    return _browser_oj_input.pop(0)\nsys.stdout = _Stream()\nsys.stderr = _Stream()\ntry:\n${event.data.code.split('\n').map((line) => `    ${line}`).join('\n')}\nexcept BaseException:\n    _browser_oj_error = True\n    import traceback\n    traceback.print_exc()\n`
    const module = __BRYTHON__.runPythonSource(harness, { id: `browser_oj_brython_${++runId}` }) as { _browser_oj_output?: string; _browser_oj_error?: boolean }
    output = module._browser_oj_output || ''
    scope.postMessage({ type: 'result', output: output.trim(), error: module._browser_oj_error ? output.trim() || '运行错误' : undefined })
  } catch (error) {
    scope.postMessage({ type: 'result', output: output.trim(), error: (error as Error).message || String(error) })
  }
}
