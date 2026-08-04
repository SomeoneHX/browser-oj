declare module 'JSCPP' {
  interface JSCPPConfig {
    stdio?: {
      write?: (s: string) => void
      read?: () => string | null
    }
  }
  interface JSCPPScope {
    run: (code: string, input: string, config?: JSCPPConfig) => number
  }
  const JSCPP: JSCPPScope
  export default JSCPP
}
