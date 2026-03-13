import { Link } from 'react-router-dom'
import { FiTrendingUp, FiArrowLeft, FiUser, FiMail } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const createdLabel = user.createdAt
    ? new Date(user.createdAt).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <Link to="/" className="back-link">
          <FiArrowLeft size={18} />
          Home
        </Link>
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={22} />
          </div>
          <span>Finyx</span>
        </div>
      </nav>

      <main className="profile-main">
        <section className="profile-card">
          <div className="avatar">
            <FiUser size={32} />
          </div>
          <h1>Your profile</h1>
          <div className="profile-row">
            <span className="label">
              <FiMail size={16} />
              Email
            </span>
            <span className="value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="label">Member since</span>
            <span className="value">{createdLabel}</span>
          </div>
        </section>
      </main>
    </div>
  )
}

