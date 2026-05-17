import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FiTrendingUp,
  FiTrendingDown,
  FiPlus,
  FiTrash2,
  FiDollarSign,
  FiPieChart,
  FiArrowLeft,
} from 'react-icons/fi'
import './TransactionsPage.css'
import { apiFetch } from '../api/client'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other']

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiFetch('/api/transactions')
        if (!cancelled) setTransactions(data.transactions || [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load transactions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0 || !formData.description.trim() || !formData.category) return
    try {
      const data = await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: formData.type,
          amount,
          description: formData.description.trim(),
          category: formData.category,
          date: formData.date,
        }),
      })
      setTransactions([data.transaction, ...transactions])
      setFormData({
        type: formData.type,
        amount: '',
        description: '',
        category: formData.type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
        date: new Date().toISOString().split('T')[0],
      })
    } catch (e) {
      setError(e.message || 'Failed to add transaction')
    }
  }

  const handleDelete = async (id) => {
    setError('')
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
      setTransactions(transactions.filter((t) => t.id !== id))
    } catch (e) {
      setError(e.message || 'Failed to delete transaction')
    }
  }

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    }))
  }

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const expensesByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount)
      return acc
    }, {})

  return (
    <div className="transactions-page">
      <div className="transactions-nav">
        <div className="transactions-nav-links">
          <Link to="/" className="back-link">
            <FiArrowLeft size={20} />
            Home
          </Link>
          <Link to="/budget" className="nav-link">Budget</Link>
          <Link to="/goals" className="nav-link">Goals</Link>
          <Link to="/insights" className="nav-link">Insights</Link>
        </div>
        <div className="nav-brand">
          <div className="logo-icon">
            <FiTrendingUp size={24} />
          </div>
          <span>Finyx</span>
        </div>
      </div>

      <main className="transactions-main">
        <h1 className="page-title">Transactions</h1>
        {error && <div className="transactions-error">{error}</div>}

        {/* Summary Cards */}
        <section className="summary-cards">
          <div className="summary-card income">
            <div className="summary-icon">
              <FiTrendingUp size={24} />
            </div>
            <div className="summary-content">
              <span>Total Income</span>
              <strong>{formatCurrency(totalIncome)}</strong>
            </div>
          </div>
          <div className="summary-card expense">
            <div className="summary-icon">
              <FiTrendingDown size={24} />
            </div>
            <div className="summary-content">
              <span>Total Expenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
          </div>
          <div className="summary-card savings">
            <div className="summary-icon">
              <FiDollarSign size={24} />
            </div>
            <div className="summary-content">
              <span>Savings</span>
              <strong className={savings >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(savings)}
              </strong>
              {totalIncome > 0 && (
                <small>{savingsRate}% of income</small>
              )}
            </div>
          </div>
        </section>

        {/* Add Transaction Form */}
        <section className="add-transaction">
          <h2>
            <FiPlus size={22} />
            Add Transaction
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-type-toggle">
              <button
                type="button"
                className={formData.type === 'income' ? 'active income' : ''}
                onClick={() => handleTypeChange('income')}
              >
                <FiTrendingUp size={18} />
                Income
              </button>
              <button
                type="button"
                className={formData.type === 'expense' ? 'active expense' : ''}
                onClick={() => handleTypeChange('expense')}
              >
                <FiTrendingDown size={18} />
                Expense
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="e.g. Grocery shopping, Salary..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-submit">
              <FiPlus size={18} />
              Add {formData.type === 'income' ? 'Income' : 'Expense'}
            </button>
          </form>
        </section>

        {/* Expense Breakdown */}
        {Object.keys(expensesByCategory).length > 0 && (
          <section className="expense-breakdown">
            <h2>
              <FiPieChart size={22} />
              Spending by Category
            </h2>
            <div className="breakdown-list">
              {Object.entries(expensesByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                  return (
                    <div key={category} className="breakdown-item">
                      <div className="breakdown-info">
                        <span className="category">{category}</span>
                        <span className="amount">{formatCurrency(amount)}</span>
                      </div>
                      <div className="breakdown-bar">
                        <div
                          className="breakdown-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="breakdown-pct">{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* Transaction List */}
        <section className="transaction-list">
          <h2>Recent Transactions</h2>
          {loading ? (
            <div className="empty-state">
              <FiDollarSign size={48} />
              <p>Loading…</p>
              <span>Fetching your transactions</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <FiDollarSign size={48} />
              <p>No transactions yet</p>
              <span>Add your first income or expense above</span>
            </div>
          ) : (
            <div className="transactions-table">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className={`transaction-item ${t.type}`}
                >
                  <div className="transaction-icon">
                    {t.type === 'income' ? (
                      <FiTrendingUp size={20} />
                    ) : (
                      <FiTrendingDown size={20} />
                    )}
                  </div>
                  <div className="transaction-details">
                    <strong>{t.description}</strong>
                    <span>
                      {t.category} • {formatDate(t.date)}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    <span className={t.type === 'income' ? 'positive' : 'negative'}>
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(t.id)}
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default TransactionsPage
