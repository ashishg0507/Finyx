import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import './BudgetPage.css'
import {
  FiTrendingUp,
  FiArrowLeft,
  FiTarget,
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
  FiPieChart,
  FiEdit2,
  FiZap,
} from 'react-icons/fi'
import { apiFetch } from '../api/client'

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']

// 50/30/20 suggested split (of total budget): needs %, wants %, savings %
const PRESET_503020 = {
  Food: 15,
  Transport: 10,
  Shopping: 12,
  Bills: 20,
  Entertainment: 8,
  Health: 5,
  Education: 10,
  Other: 20,
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)

const getThisMonthKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const getMonthName = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const getSpentThisMonthByCategory = (transactions) => {
  const key = getThisMonthKey()
  return transactions
    .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(key))
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount)
      return acc
    }, {})
}

const getSpentLastMonthByCategory = (transactions) => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return transactions
    .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(key))
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount)
      return acc
    }, {})
}

const BudgetPage = () => {
  const [budgets, setBudgets] = useState({})
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [totalBudgetInput, setTotalBudgetInput] = useState('')
  const [showPresetModal, setShowPresetModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const tx = await apiFetch('/api/transactions')
        if (!cancelled) setTransactions(tx.transactions || [])

        const monthKey = getThisMonthKey()
        const b = await apiFetch(`/api/budgets?month=${monthKey}`)
        if (!cancelled) setBudgets(b.budgets || {})
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load budget data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const saveBudgets = async (nextBudgets) => {
    const monthKey = getThisMonthKey()
    await apiFetch(`/api/budgets?month=${monthKey}`, {
      method: 'PUT',
      body: JSON.stringify({ budgets: nextBudgets }),
    })
  }

  const spentByCategory = useMemo(() => getSpentThisMonthByCategory(transactions), [transactions])
  const lastMonthByCategory = useMemo(() => getSpentLastMonthByCategory(transactions), [transactions])
  const monthLabel = getMonthName(getThisMonthKey())

  const totalBudget = EXPENSE_CATEGORIES.reduce((sum, cat) => sum + (Number(budgets[cat]) || 0), 0)
  const totalSpent = Object.values(spentByCategory).reduce((a, b) => a + b, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercent = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

  const startEdit = (category) => {
    setEditingCategory(category)
    setEditValue(String(budgets[category] ?? ''))
  }

  const saveEdit = async () => {
    if (editingCategory == null) return
    const num = parseFloat(editValue)
    if (!isNaN(num) && num >= 0) {
      const next = { ...budgets, [editingCategory]: num }
      setBudgets(next)
      try {
        setError('')
        await saveBudgets(next)
      } catch (e) {
        setError(e.message || 'Failed to save budget')
      }
    }
    setEditingCategory(null)
    setEditValue('')
  }

  const applyPreset503020 = async () => {
    const total = parseFloat(totalBudgetInput) || 0
    if (total <= 0) return
    const next = {}
    EXPENSE_CATEGORIES.forEach((cat) => {
      next[cat] = Math.round((total * (PRESET_503020[cat] || 0)) / 100)
    })
    setBudgets(next)
    try {
      setError('')
      await saveBudgets(next)
    } catch (e) {
      setError(e.message || 'Failed to save budget')
    }
    setTotalBudgetInput('')
    setShowPresetModal(false)
  }

  const applyMatchLastMonth = async () => {
    const next = {}
    EXPENSE_CATEGORIES.forEach((cat) => {
      next[cat] = Math.round((lastMonthByCategory[cat] || 0) * 100) / 100
    })
    setBudgets(next)
    try {
      setError('')
      await saveBudgets(next)
    } catch (e) {
      setError(e.message || 'Failed to save budget')
    }
    setShowPresetModal(false)
  }

  const alerts = useMemo(() => {
    const list = []
    EXPENSE_CATEGORIES.forEach((cat) => {
      const budget = Number(budgets[cat]) || 0
      const spent = spentByCategory[cat] || 0
      if (budget <= 0) return
      const pct = (spent / budget) * 100
      if (pct >= 100) list.push({ category: cat, type: 'over', spent, budget })
      else if (pct >= 80) list.push({ category: cat, type: 'warning', pct, spent, budget })
    })
    return list
  }, [budgets, spentByCategory])

  return (
    <div className="budget-page">
      <nav className="budget-nav">
        <div className="budget-nav-links">
          <Link to="/" className="back-link">
            <FiArrowLeft size={20} />
            Home
          </Link>
          <Link to="/transactions" className="nav-link">Transactions</Link>
          <Link to="/goals" className="nav-link">Goals</Link>
          <Link to="/insights" className="nav-link">Insights</Link>
        </div>
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={24} />
          </div>
          <span>Finyx</span>
        </div>
      </nav>

      <main className="budget-main">
        <div className="budget-header">
          <h1 className="page-title">
            <FiTarget size={28} />
            Budget
          </h1>
          <p className="budget-period">{monthLabel}</p>
          <button type="button" className="btn-preset" onClick={() => setShowPresetModal(true)}>
            <FiZap size={18} />
            Quick setup
          </button>
        </div>
        {error && <div className="budget-error">{error}</div>}

        {/* Preset modal */}
        {showPresetModal && (
          <div className="modal-overlay" onClick={() => setShowPresetModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Quick budget setup</h3>
              <div className="preset-option">
                <h4>50/30/20 rule</h4>
                <p>Set category budgets from a total (e.g. monthly income). We'll split by common ratios.</p>
                <div className="preset-input-row">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Total monthly budget (₹)"
                    value={totalBudgetInput}
                    onChange={(e) => setTotalBudgetInput(e.target.value)}
                  />
                  <button type="button" className="btn-apply" onClick={applyPreset503020}>
                    Apply
                  </button>
                </div>
              </div>
              <div className="preset-option">
                <h4>Match last month</h4>
                <p>Use last month's actual spending as this month's budget.</p>
                <button type="button" className="btn-apply" onClick={applyMatchLastMonth}>
                  Use last month
                </button>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setShowPresetModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <section className="budget-alerts">
            {alerts.map((a) => (
              <div key={a.category} className={`alert-item ${a.type}`}>
                {a.type === 'over' ? (
                  <FiAlertTriangle size={18} />
                ) : (
                  <FiAlertTriangle size={18} />
                )}
                <span>
                  {a.category}: {a.type === 'over'
                    ? `Over by ${formatCurrency(a.spent - a.budget)}`
                    : `${a.pct.toFixed(0)}% used`}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Overview cards */}
        <section className="budget-overview">
          <div className="overview-card total-budget">
            <FiDollarSign size={22} />
            <div>
              <span>Total budget</span>
              <strong>{formatCurrency(totalBudget)}</strong>
            </div>
          </div>
          <div className="overview-card total-spent">
            <FiPieChart size={22} />
            <div>
              <span>Spent this month</span>
              <strong>{formatCurrency(totalSpent)}</strong>
            </div>
          </div>
          <div className="overview-card remaining">
            <FiCheckCircle size={22} />
            <div>
              <span>Remaining</span>
              <strong className={totalRemaining >= 0 ? 'ok' : 'over'}>{formatCurrency(totalRemaining)}</strong>
            </div>
          </div>
        </section>

        {/* Overall progress */}
        <div className="overall-progress">
          <div className="progress-header">
            <span>Monthly progress</span>
            <span>{overallPercent.toFixed(0)}% used</span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${overallPercent >= 100 ? 'over' : overallPercent >= 80 ? 'warn' : ''}`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>

        {/* Category budgets */}
        <section className="category-budgets">
          <h2>By category</h2>
          {loading && <div className="budget-loading">Loading…</div>}
          <div className="category-list">
            {EXPENSE_CATEGORIES.map((cat) => {
              const budget = Number(budgets[cat]) || 0
              const spent = spentByCategory[cat] || 0
              const remaining = budget - spent
              const pct = budget > 0 ? (spent / budget) * 100 : 0
              const isEditing = editingCategory === cat

              return (
                <div key={cat} className="category-row">
                  <div className="category-name">{cat}</div>
                  <div className="category-amounts">
                    {isEditing ? (
                      <div className="edit-inline">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                        />
                        <button type="button" className="btn-save-edit" onClick={saveEdit}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="amount budget" onClick={() => startEdit(cat)} title="Click to edit">
                          {formatCurrency(budget)}
                          <FiEdit2 size={12} className="edit-icon" />
                        </span>
                        <span className="amount spent">{formatCurrency(spent)}</span>
                        <span className={`amount remaining ${remaining >= 0 ? 'ok' : 'over'}`}>
                          {formatCurrency(remaining)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="category-bar-wrap">
                    <div
                      className={`category-bar ${pct >= 100 ? 'over' : pct >= 80 ? 'warn' : ''}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <p className="budget-hint">
          Budgets are based on your transactions. Add limits above and track spending on the{' '}
          <Link to="/transactions">Transactions</Link> page.
        </p>
      </main>
    </div>
  )
}

export default BudgetPage
