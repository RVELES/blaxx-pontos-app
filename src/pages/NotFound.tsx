import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="main center" style={{ minHeight: '100vh' }}>
      <div className="center-wrap center-text">
        <h1 style={{ fontSize: 72 }}>404</h1>
        <p className="muted">Página não encontrada</p>
        <Link to="/dashboard" className="btn primary mt-6">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
