import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiTrendingUp, FiArrowLeft, FiUserPlus } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import './AuthPages.css'

export default function SignUpPage() {
  const nav = useNavigate()
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(email, password)
      nav('/transactions', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign up failed')
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
        <h1>Create your account</h1>
        <p>Track transactions, set budgets, create goals, and unlock insights.</p>

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
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>
          <div className="auth-actions">
            <button className="auth-primary" type="submit" disabled={loading}>
              <FiUserPlus size={18} />
              {loading ? 'Creating…' : 'Sign Up'}
            </button>
            <div className="auth-secondary">
              Already have an account? <Link to="/signin">Sign in</Link>
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

