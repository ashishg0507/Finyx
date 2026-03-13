import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowLeft,
  FiTrendingUp,
  FiTarget,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
} from 'react-icons/fi'
import './GoalsPage.css'
import { apiFetch } from '../api/client'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)

const todayISO = () => new Date().toISOString().split('T')[0]

const monthsBetween = (fromISO, toISO) => {
  const f = new Date(fromISO)
  const t = new Date(toISO)
  const months = (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth())
  return Math.max(0, months + (t.getDate() >= f.getDate() ? 1 : 0))
}

const getThisMonthKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const GoalsPage = () => {
  const [goals, setGoals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    dueDate: '',
    priority: 'medium',
  })

  const [contrib, setContrib] = useState({ goalId: null, amount: '', date: todayISO(), note: '' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const tx = await apiFetch('/api/transactions')
        const g = await apiFetch('/api/goals')
        if (!cancelled) {
          setTransactions(tx.transactions || [])
          setGoals(g.goals || [])
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load goals')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const thisMonthSavings = useMemo(() => {
    const key = getThisMonthKey()
    const income = transactions
      .filter((t) => t.type === 'income' && t.date && t.date.startsWith(key))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const expense = transactions
      .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(key))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return income - expense
  }, [transactions])

  const totals = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + (Number(g.targetAmount) || 0), 0)
    const totalSaved = goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0)
    return { totalTarget, totalSaved }
  }, [goals])

  const addGoal = async (e) => {
    e.preventDefault()
    setError('')
    const target = parseFloat(goalForm.targetAmount)
    const current = parseFloat(goalForm.currentAmount || 0)
    if (!goalForm.name.trim() || !target || target <= 0 || current < 0) return
    try {
      const data = await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: goalForm.name.trim(),
          targetAmount: target,
          currentAmount: current,
          dueDate: goalForm.dueDate || null,
          priority: goalForm.priority,
        }),
      })
      setGoals([{ ...data.goal, contributions: [] }, ...goals])
      setGoalForm({ name: '', targetAmount: '', currentAmount: '', dueDate: '', priority: 'medium' })
    } catch (e) {
      setError(e.message || 'Failed to create goal')
    }
  }

  const deleteGoal = async (id) => {
    setError('')
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'DELETE' })
      setGoals(goals.filter((g) => g.id !== id))
    } catch (e) {
      setError(e.message || 'Failed to delete goal')
    }
  }

  const openContribution = (goalId) =>
    setContrib({ goalId, amount: '', date: todayISO(), note: '' })

  const addContribution = async (e) => {
    e.preventDefault()
    const amount = parseFloat(contrib.amount)
    if (!contrib.goalId || !amount || amount <= 0) return
    setError('')
    try {
      const data = await apiFetch(`/api/goals/${contrib.goalId}/contributions`, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          date: contrib.date || todayISO(),
          note: contrib.note?.trim() || null,
        }),
      })
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== contrib.goalId) return g
          return {
            ...g,
            currentAmount: data.goal.currentAmount,
            contributions: [data.contribution, ...(g.contributions || [])],
          }
        }),
      )
      setContrib({ goalId: null, amount: '', date: todayISO(), note: '' })
    } catch (e) {
      setError(e.message || 'Failed to add contribution')
    }
  }

  const quickAddFromSavings = (goalId) => {
    const amount = Math.max(0, Number(thisMonthSavings))
    if (!amount) return
    setContrib({ goalId, amount: String(Math.round(amount * 100) / 100), date: todayISO(), note: 'Added from this month savings' })
  }

  return (
    <div className="goals-page">
      <nav className="page-nav">
        <div className="nav-left">
          <Link to="/" className="back-link">
            <FiArrowLeft size={20} />
            Home
          </Link>
          <Link to="/transactions" className="nav-link">Transactions</Link>
          <Link to="/budget" className="nav-link">Budget</Link>
          <Link to="/insights" className="nav-link">Insights</Link>
        </div>
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={24} />
          </div>
          <span>Finyx</span>
        </div>
      </nav>

      <main className="goals-main">
        <div className="header">
          <h1 className="page-title">
            <FiTarget size={28} />
            Goals
          </h1>
          <div className="meta">
            <div className="meta-card">
              <span>Total saved</span>
              <strong>{formatCurrency(totals.totalSaved)}</strong>
            </div>
            <div className="meta-card">
              <span>Total targets</span>
              <strong>{formatCurrency(totals.totalTarget)}</strong>
            </div>
            <div className="meta-card accent">
              <span>This month savings</span>
              <strong className={thisMonthSavings >= 0 ? 'ok' : 'over'}>{formatCurrency(thisMonthSavings)}</strong>
            </div>
          </div>
        </div>
        {error && <div className="goals-error">{error}</div>}

        <section className="panel">
          <h2>
            <FiPlus size={20} /> Create a goal
          </h2>
          <form className="goal-form" onSubmit={addGoal}>
            <div className="row">
              <div className="field">
                <label>Goal name</label>
                <input
                  type="text"
                  placeholder="e.g. New Laptop, Emergency Fund"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Priority</label>
                <select
                  value={goalForm.priority}
                  onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Target amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Already saved (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                />
              </div>
              <div className="field">
                <label>
                  <FiCalendar size={14} /> Due date (optional)
                </label>
                <input
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <button className="btn-primary" type="submit">
              <FiPlus size={18} /> Add goal
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Active goals</h2>
          {loading ? (
            <div className="empty">
              <FiDollarSign size={48} />
              <p>Loading…</p>
              <span>Fetching your goals</span>
            </div>
          ) : goals.length === 0 ? (
            <div className="empty">
              <FiDollarSign size={48} />
              <p>No goals yet</p>
              <span>Create your first goal above.</span>
            </div>
          ) : (
            <div className="goals-grid">
              {goals.map((g) => {
                const target = Number(g.targetAmount) || 0
                const current = Number(g.currentAmount) || 0
                const remaining = Math.max(0, target - current)
                const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
                const monthsLeft = g.dueDate ? monthsBetween(todayISO(), g.dueDate) : 0
                const perMonth = g.dueDate && monthsLeft > 0 ? remaining / monthsLeft : null
                const done = current >= target && target > 0

                return (
                  <div key={g.id} className={`goal-card ${done ? 'done' : ''}`}>
                    <div className="goal-top">
                      <div className="goal-title">
                        <strong>{g.name}</strong>
                        <span className={`pill ${g.priority}`}>{g.priority}</span>
                      </div>
                      <button className="btn-icon" onClick={() => deleteGoal(g.id)} title="Delete goal">
                        <FiTrash2 size={18} />
                      </button>
                    </div>

                    <div className="goal-amounts">
                      <div>
                        <span>Saved</span>
                        <strong>{formatCurrency(current)}</strong>
                      </div>
                      <div>
                        <span>Target</span>
                        <strong>{formatCurrency(target)}</strong>
                      </div>
                      <div>
                        <span>Remaining</span>
                        <strong>{formatCurrency(remaining)}</strong>
                      </div>
                    </div>

                    <div className="goal-progress">
                      <div className="progress-header">
                        <span>{pct.toFixed(0)}%</span>
                        {g.dueDate ? <span>Due {g.dueDate}</span> : <span>No deadline</span>}
                      </div>
                      <div className="track">
                        <div className="fill" style={{ width: `${pct}%` }} />
                      </div>
                      {perMonth != null && (
                        <div className="helper">
                          To hit the deadline: <strong>{formatCurrency(perMonth)}</strong> / month
                        </div>
                      )}
                      {done && (
                        <div className="helper ok">
                          <FiCheckCircle size={16} /> Goal achieved
                        </div>
                      )}
                    </div>

                    <div className="goal-actions">
                      <button className="btn-outline" onClick={() => openContribution(g.id)} type="button">
                        <FiPlus size={16} /> Add money
                      </button>
                      <button className="btn-ghost" onClick={() => quickAddFromSavings(g.id)} type="button" title="Prefill using this month's savings">
                        Use month savings
                      </button>
                    </div>

                    {contrib.goalId === g.id && (
                      <form className="contrib-form" onSubmit={addContribution}>
                        <div className="row">
                          <div className="field">
                            <label>Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={contrib.amount}
                              onChange={(e) => setContrib({ ...contrib, amount: e.target.value })}
                              required
                            />
                          </div>
                          <div className="field">
                            <label>Date</label>
                            <input
                              type="date"
                              value={contrib.date}
                              onChange={(e) => setContrib({ ...contrib, date: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="field">
                          <label>Note (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. bonus, side gig…"
                            value={contrib.note}
                            onChange={(e) => setContrib({ ...contrib, note: e.target.value })}
                          />
                        </div>
                        <button className="btn-primary" type="submit">
                          <FiPlus size={16} /> Add contribution
                        </button>
                      </form>
                    )}

                    {(g.contributions || []).length > 0 && (
                      <div className="contrib-list">
                        <div className="contrib-title">Recent contributions</div>
                        {(g.contributions || []).slice(0, 3).map((c) => (
                          <div key={c.id} className="contrib-item">
                            <span className="amt">+{formatCurrency(c.amount)}</span>
                            <span className="meta">{c.date}{c.note ? ` • ${c.note}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default GoalsPage
