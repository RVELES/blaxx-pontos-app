// Guard de rota — espelha Session.requireAuth() do Windows.
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Session, setUnauthorizedHandler } from '../lib/api-client'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  // Registra o redirect global de 401 (handler do api-client).
  useEffect(() => {
    setUnauthorizedHandler(() => navigate('/login', { replace: true }))
  }, [navigate])

  if (!Session.isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
