import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowLeft,
  FiTrendingUp,
  FiBarChart2,
  FiTrendingDown,
  FiPieChart,
  FiAlertTriangle,
  FiRepeat,
  FiCalendar,
} from 'react-icons/fi'
import './InsightsPage.css'
import { apiFetch } from '../api/client'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)

const monthKeyFromISO = (iso) => (iso && iso.length >= 7 ? iso.slice(0, 7) : '')

const monthLabel = (key) => {
  if (!key) return 'All time'
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

const normalizeDesc = (s) =>
  (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const InsightsPage = () => {
  const [transactions, setTransactions] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('') // '' => all time
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiFetch('/api/transactions')
        if (!cancelled) setTransactions(data.transactions || [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load insights')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const months = useMemo(() => {
    const keys = new Set()
    transactions.forEach((t) => {
      const k = monthKeyFromISO(t.date)
      if (k) keys.add(k)
    })
    return Array.from(keys).sort((a, b) => (a < b ? 1 : -1))
  }, [transactions])

  useEffect(() => {
    if (selectedMonth && !months.includes(selectedMonth)) setSelectedMonth('')
  }, [months, selectedMonth])

  const filtered = useMemo(() => {
    if (!selectedMonth) return transactions
    return transactions.filter((t) => monthKeyFromISO(t.date) === selectedMonth)
  }, [transactions, selectedMonth])

  const prevMonthKey = useMemo(() => {
    if (!selectedMonth) return ''
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [selectedMonth])

  const prevFiltered = useMemo(() => {
    if (!prevMonthKey) return []
    return transactions.filter((t) => monthKeyFromISO(t.date) === prevMonthKey)
  }, [transactions, prevMonthKey])

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    return { income, expense, net: income - expense }
  }, [filtered])

  const prevTotals = useMemo(() => {
    const income = prevFiltered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expense = prevFiltered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    return { income, expense, net: income - expense }
  }, [prevFiltered])

  const deltas = useMemo(() => {
    if (!selectedMonth) return null
    const pct = (cur, prev) => (prev === 0 ? null : ((cur - prev) / prev) * 100)
    return {
      income: pct(totals.income, prevTotals.income),
      expense: pct(totals.expense, prevTotals.expense),
      net: pct(totals.net, prevTotals.net),
    }
  }, [selectedMonth, totals, prevTotals])

  const expenseByCategory = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const cat = t.category || 'Other'
        acc[cat] = (acc[cat] || 0) + Number(t.amount || 0)
        return acc
      }, {})
  }, [filtered])

  const topCategories = useMemo(() => {
    return Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))
  }, [expenseByCategory])

  const largestExpense = useMemo(() => {
    const ex = filtered.filter((t) => t.type === 'expense')
    if (ex.length === 0) return null
    const top = ex.reduce((best, t) => (Number(t.amount || 0) > Number(best.amount || 0) ? t : best), ex[0])
    return top
  }, [filtered])

  const projection = useMemo(() => {
    // Only meaningful for a selected month that is the current month
    if (!selectedMonth) return null
    const now = new Date()
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    if (selectedMonth !== currentKey) return null

    const day = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const spentToDate = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    const dailyAvg = day > 0 ? spentToDate / day : 0
    return {
      daysInMonth,
      day,
      spentToDate,
      dailyAvg,
      projected: dailyAvg * daysInMonth,
    }
  }, [filtered, selectedMonth])

  const recurringCandidates = useMemo(() => {
    // Looks at ALL TIME patterns (not filtered), because recurring spend is cross-month
    const expenses = transactions.filter((t) => t.type === 'expense')
    const byDesc = new Map()
    expenses.forEach((t) => {
      const d = normalizeDesc(t.description)
      if (!d || d.length < 3) return
      const list = byDesc.get(d) || []
      list.push(t)
      byDesc.set(d, list)
    })

    const candidates = []
    byDesc.forEach((list, desc) => {
      if (list.length < 3) return
      // Must occur in at least 2 different months
      const months = new Set(list.map((t) => monthKeyFromISO(t.date)))
      if (months.size < 2) return
      const total = list.reduce((s, t) => s + Number(t.amount || 0), 0)
      const avg = total / list.length
      candidates.push({
        desc,
        count: list.length,
        months: months.size,
        avg,
        last: list.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0],
      })
    })

    return candidates.sort((a, b) => b.avg - a.avg).slice(0, 6)
  }, [transactions])

  const spendingHeat = useMemo(() => {
    // Day-of-week x time-of-month feel: show simple weekday totals for selected month
    const map = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
    filtered
      .filter((t) => t.type === 'expense' && t.date)
      .forEach((t) => {
        const d = new Date(t.date)
        const key = d.toLocaleString('en-US', { weekday: 'short' })
        map[key] = (map[key] || 0) + Number(t.amount || 0)
      })
    const arr = Object.entries(map).map(([day, amount]) => ({ day, amount }))
    const max = Math.max(1, ...arr.map((x) => x.amount))
    return { arr, max }
  }, [filtered])

  const insightBullets = useMemo(() => {
    const bullets = []
    if (totals.income > 0) {
      const savingsRate = ((totals.net / totals.income) * 100)
      bullets.push({
        title: 'Savings rate',
        value: `${clamp(savingsRate, -999, 999).toFixed(1)}%`,
        tone: totals.net >= 0 ? 'ok' : 'bad',
      })
    }
    if (largestExpense) {
      bullets.push({
        title: 'Largest expense',
        value: `${formatCurrency(Number(largestExpense.amount || 0))} • ${largestExpense.category || 'Other'}`,
        tone: 'neutral',
      })
    }
    if (topCategories[0]) {
      const pct = totals.expense > 0 ? (topCategories[0].amount / totals.expense) * 100 : 0
      bullets.push({
        title: 'Top category',
        value: `${topCategories[0].category} (${pct.toFixed(0)}%)`,
        tone: 'neutral',
      })
    }
    return bullets
  }, [largestExpense, topCategories, totals])

  const maxTop = Math.max(1, ...topCategories.map((c) => c.amount))

  return (
    <div className="insights-page">
      <nav className="page-nav">
        <div className="nav-left">
          <Link to="/" className="back-link">
            <FiArrowLeft size={20} />
            Home
          </Link>
          <Link to="/transactions" className="nav-link">Transactions</Link>
          <Link to="/budget" className="nav-link">Budget</Link>
          <Link to="/goals" className="nav-link">Goals</Link>
        </div>
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={24} />
          </div>
          <span>Finyx</span>
        </div>
      </nav>

      <main className="insights-main">
        <div className="header">
          <h1 className="page-title">
            <FiBarChart2 size={28} />
            Insights
          </h1>
          <div className="month-picker">
            <label>
              <FiCalendar size={16} /> Month
            </label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">All time</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className="insights-error">{error}</div>}

        {/* Totals */}
        <section className="cards">
          <div className="card income">
            <div className="icon"><FiTrendingUp size={22} /></div>
            <div className="content">
              <span>Income</span>
              <strong>{formatCurrency(totals.income)}</strong>
              {deltas?.income != null && (
                <small className={deltas.income >= 0 ? 'ok' : 'bad'}>{deltas.income >= 0 ? '+' : ''}{deltas.income.toFixed(0)}% vs {monthLabel(prevMonthKey)}</small>
              )}
            </div>
          </div>
          <div className="card expense">
            <div className="icon"><FiTrendingDown size={22} /></div>
            <div className="content">
              <span>Expenses</span>
              <strong>{formatCurrency(totals.expense)}</strong>
              {deltas?.expense != null && (
                <small className={deltas.expense <= 0 ? 'ok' : 'bad'}>{deltas.expense >= 0 ? '+' : ''}{deltas.expense.toFixed(0)}% vs {monthLabel(prevMonthKey)}</small>
              )}
            </div>
          </div>
          <div className="card net">
            <div className="icon"><FiPieChart size={22} /></div>
            <div className="content">
              <span>Net</span>
              <strong className={totals.net >= 0 ? 'ok' : 'bad'}>{formatCurrency(totals.net)}</strong>
              {deltas?.net != null && (
                <small className={deltas.net >= 0 ? 'ok' : 'bad'}>{deltas.net >= 0 ? '+' : ''}{deltas.net.toFixed(0)}% vs {monthLabel(prevMonthKey)}</small>
              )}
            </div>
          </div>
        </section>

        {/* Insights bullets */}
        {insightBullets.length > 0 && (
          <section className="panel bullets">
            {insightBullets.map((b) => (
              <div key={b.title} className={`bullet ${b.tone}`}>
                <span className="title">{b.title}</span>
                <strong className="value">{b.value}</strong>
              </div>
            ))}
          </section>
        )}

        {/* Top categories */}
        <section className="panel">
          <h2>Top spending categories</h2>
          {loading ? (
            <div className="empty">
              <FiPieChart size={44} />
              <p>Loading…</p>
              <span>Fetching your transactions</span>
            </div>
          ) : topCategories.length === 0 ? (
            <div className="empty">
              <FiPieChart size={44} />
              <p>No expense data yet</p>
              <span>Add some expenses in Transactions to see insights.</span>
            </div>
          ) : (
            <div className="bars">
              {topCategories.map((c) => (
                <div key={c.category} className="bar-row">
                  <div className="bar-head">
                    <span>{c.category}</span>
                    <span className="amt">{formatCurrency(c.amount)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(c.amount / maxTop) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projection */}
        {projection && (
          <section className="panel">
            <h2>End-of-month projection</h2>
            <div className="projection">
              <div className="proj-card">
                <span>Spent so far (day {projection.day}/{projection.daysInMonth})</span>
                <strong>{formatCurrency(projection.spentToDate)}</strong>
              </div>
              <div className="proj-card">
                <span>Daily average</span>
                <strong>{formatCurrency(projection.dailyAvg)}</strong>
              </div>
              <div className="proj-card accent">
                <span>Projected month spend</span>
                <strong>{formatCurrency(projection.projected)}</strong>
              </div>
            </div>
            <p className="note">
              Projection is based on your average daily spending so far this month.
            </p>
          </section>
        )}

        {/* Weekday spend */}
        <section className="panel">
          <h2>Spending by weekday</h2>
          <div className="weekday">
            {spendingHeat.arr.map((d) => (
              <div key={d.day} className="weekday-row">
                <span className="day">{d.day}</span>
                <div className="wtrack">
                  <div className="wfill" style={{ width: `${(d.amount / spendingHeat.max) * 100}%` }} />
                </div>
                <span className="amt">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recurring */}
        <section className="panel">
          <h2>
            <FiRepeat size={18} /> Recurring expense candidates
          </h2>
          {recurringCandidates.length === 0 ? (
            <div className="hint">
              <FiAlertTriangle size={18} />
              <span>Add more transactions over time to detect recurring spending (subscriptions, bills).</span>
            </div>
          ) : (
            <div className="recurring">
              {recurringCandidates.map((r) => (
                <div key={r.desc} className="rec-card">
                  <strong className="desc">{r.last.description || r.desc}</strong>
                  <div className="rec-meta">
                    <span>{r.count} times</span>
                    <span>•</span>
                    <span>{r.months} months</span>
                    <span>•</span>
                    <span>avg {formatCurrency(r.avg)}</span>
                  </div>
                  <div className="rec-last">
                    Last: {r.last.date || '—'} • {formatCurrency(Number(r.last.amount || 0))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default InsightsPage
