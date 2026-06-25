// Captura erros de render — não deixa a SPA virar tela branca.
// Fallback brandado: logo + título + 2 CTAs (Tentar de novo / Voltar à home)
// + detalhes técnicos colapsáveis pra debug. Em DEV, console mantém stack;
// em PROD, vamos pluggar Sentry quando o DSN chegar.
import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null; stack: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, stack: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, stack: '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const stack = info.componentStack || ''
    this.setState({ stack })
    // Em DEV deixa o stack original visível pro grupo de console — em PROD,
    // futuramente, isso vai pro Sentry quando o DSN estiver no ambiente.
    console.error('[BlaXx] erro de render:', error, stack)
    // Hook futuro: Sentry.captureException(error, { contexts: { react: { componentStack: stack }}})
  }

  private reset = () => {
    // Permite que a SPA tente re-renderizar sem reload — útil quando o erro
    // foi numa rota específica e o usuário consegue voltar pra home/dashboard
    // sem perder estado de sessão.
    this.setState({ hasError: false, error: null, stack: '' })
  }

  private goHome = () => {
    // Hard navigate pra zerar tudo. Se o erro foi em chunk lazy, o reload
    // do entry resolve cache stale.
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const errMsg = this.state.error?.message || 'Erro desconhecido'

    return (
      <div className="blx-err">
        {/* Logo + marca pra criar âncora visual mesmo numa tela de erro */}
        <div className="blx-err__brand" aria-hidden>
          <span className="blx-err__mark">B</span>
          <span className="blx-err__word">la<span style={{ color: '#59FD27' }}>X</span><span style={{ color: '#59FD27' }}>x</span></span>
        </div>

        <h1>Algo deu errado</h1>
        <p>
          A gente registrou o erro e já está olhando. Você pode tentar de novo —
          se persistir, volte ao início e tente outra rota.
        </p>

        <div className="blx-err__actions">
          <button onClick={this.reset} className="blx-err__btn primary">
            Tentar de novo
          </button>
          <button onClick={this.goHome} className="blx-err__btn ghost">
            Voltar ao início
          </button>
        </div>

        <details className="blx-err__details">
          <summary>Detalhes técnicos</summary>
          <code>{errMsg}</code>
          {this.state.stack && <pre>{this.state.stack.trim()}</pre>}
        </details>
      </div>
    )
  }
}
