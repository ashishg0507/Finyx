import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiArrowLeft, FiLogIn } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import './AuthPages.css'

export default function SignInPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const { signin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signin(email, password)
      const next = loc.state?.from || '/transactions'
      nav(next, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo">
            <FiTrendingUp size={22} />
          </div>
          <span>Finyx</span>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to access your budgets, goals, and insights.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>
          <div className="auth-actions">
            <button className="auth-primary" type="submit" disabled={loading}>
              <FiLogIn size={18} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="auth-secondary">
              New here? <Link to="/signup">Create an account</Link>
            </div>
          </div>
        </form>

        <Link to="/" className="auth-back">
          <FiArrowLeft size={18} />
          Back to home
        </Link>
      </div>
    </div>
  )
}

