import * as Wenyan from '@wenyan/core'

const { execute } = Wenyan

const scope = self as unknown as DedicatedWorkerGlobalScope

scope.onmessage = (event: MessageEvent<{ code: string }>) => {
  let output = ''
  try {
    execute(event.data.code, {
      lang: 'js',
      scoped: true,
      outputHanzi: false,
      logCallback: () => {},
      errorCallback: (message: unknown) => { throw new SyntaxError(String(message)) },
      output: (...values: unknown[]) => {
        output += values.map((value) => String(value)).join(' ') + '\n'
      },
    })
    scope.postMessage({ output: output.trim() })
  } catch (error) {
    scope.postMessage({ output: output.trim(), error: (error as Error).message || String(error) })
  }
}
