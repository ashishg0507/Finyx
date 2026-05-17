import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiTrendingUp, FiArrowLeft, FiUser, FiMail } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, refreshMe } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [sendingSummary, setSendingSummary] = useState(false)
  const [summaryStatus, setSummaryStatus] = useState('')

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

  const onDetailedEmailToggle = async (checked) => {
    setSaveError('')
    setSaving(true)
    try {
      await apiFetch('/api/auth/preferences/email', {
        method: 'PATCH',
        body: JSON.stringify({ detailedSummaryEmails: checked }),
      })
      await refreshMe()
    } catch (err) {
      setSaveError(err.message || 'Failed to update preference')
    } finally {
      setSaving(false)
    }
  }

  const onSendSummaryNow = async () => {
    setSummaryStatus('')
    setSaveError('')
    setSendingSummary(true)
    try {
      await apiFetch('/api/auth/summary/send-now', { method: 'POST', body: JSON.stringify({}) })
      setSummaryStatus('Summary email sent to your registered email.')
    } catch (err) {
      setSaveError(err.message || 'Failed to send summary email')
    } finally {
      setSendingSummary(false)
    }
  }

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
          <div className="profile-row">
            <span className="label">Detailed finance summary emails</span>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={Boolean(user.detailedSummaryEmails)}
                disabled={saving}
                onChange={(e) => onDetailedEmailToggle(e.target.checked)}
              />
              <span>{user.detailedSummaryEmails ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
          <div className="profile-actions">
            <button type="button" className="summary-btn" disabled={sendingSummary} onClick={onSendSummaryNow}>
              {sendingSummary ? 'Sending…' : 'Send summary now'}
            </button>
            {summaryStatus && <p className="profile-success">{summaryStatus}</p>}
          </div>
          {saveError && <p className="profile-error">{saveError}</p>}
        </section>
      </main>
    </div>
  )
}

