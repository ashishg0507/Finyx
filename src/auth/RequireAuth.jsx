import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth({ children }) {
  const { token, loading } = useAuth()
  const loc = useLocation()

  if (loading) return null
  if (!token) return <Navigate to="/signin" replace state={{ from: loc.pathname }} />
  return children
}

