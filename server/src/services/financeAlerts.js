import { Op } from 'sequelize'
import { Transaction, Budget, User, SentMonthlySummary } from '../models/index.js'
import { sendMail, isEmailConfigured, formatInr } from './mailer.js'
import { monthBounds, monthKeyFromDateString, previousMonthKey } from '../lib/monthBounds.js'

function largeExpenseThreshold() {
  const raw = process.env.LARGE_EXPENSE_THRESHOLD
  const n = raw != null && raw !== '' ? Number(raw) : 10000
  return Number.isFinite(n) && n > 0 ? n : 10000
}

async function sumExpensesInCategoryForMonth(userId, monthKey, category, { excludeTransactionId } = {}) {
  const b = monthBounds(monthKey)
  if (!b) return 0
  const where = {
    userId,
    type: 'expense',
    category,
    date: { [Op.between]: [b.start, b.end] },
  }
  if (excludeTransactionId) {
    where.id = { [Op.ne]: excludeTransactionId }
  }
  const rows = await Transaction.findAll({ where, attributes: ['amount'] })
  return rows.reduce((s, r) => s + Number(r.amount), 0)
}

async function notifyBudgetCrossed({ userEmail, category, budget, spentAfter }) {
  const over = spentAfter - budget
  const subject = `Budget alert: ${category} exceeded`
  const text = [
    `Your monthly budget for "${category}" has been exceeded.`,
    `Budget: ${formatInr(budget)}`,
    `Spent so far: ${formatInr(spentAfter)}`,
    `Exceeded by: ${formatInr(over)}`,
    '',
    'This email was sent because spending crossed your set limit for this category.',
  ].join('\n')
  await sendMail({ to: userEmail, subject, text })
}

async function notifyLargeExpense({ userEmail, amount, description, category, date }) {
  const subject = `Large expense recorded: ${formatInr(amount)}`
  const text = [
    `A single expense met or exceeded your alert threshold (${formatInr(largeExpenseThreshold())}).`,
    `Amount: ${formatInr(amount)}`,
    `Category: ${category}`,
    `Description: ${description}`,
    `Date: ${date}`,
  ].join('\n')
  await sendMail({ to: userEmail, subject, text })
}

export async function notifyAfterExpense({ userId, userEmail, transaction }) {
  if (!isEmailConfigured()) return
  const user = await User.findByPk(userId, { attributes: ['email'] })
  const recipient = (user?.email || userEmail || '').trim()
  if (!recipient) return

  const { type, amount, category, date, id } = transaction
  if (type !== 'expense') return
  const num = Number(amount)
  if (!Number.isFinite(num) || num <= 0) return

  const threshold = largeExpenseThreshold()
  if (num >= threshold) {
    await notifyLargeExpense({
      userEmail: recipient,
      amount: num,
      description: transaction.description,
      category,
      date: String(date).slice(0, 10),
    })
  }

  const monthKey = monthKeyFromDateString(date)
  if (!monthKey) return

  const budgetRow = await Budget.findOne({
    where: { userId, monthKey, category },
  })
  const budget = budgetRow ? Number(budgetRow.amount) : 0
  if (!budgetRow || budget <= 0) return

  const spentBefore = await sumExpensesInCategoryForMonth(userId, monthKey, category, {
    excludeTransactionId: id,
  })
  const spentAfter = spentBefore + num
  if (spentAfter > budget && spentBefore <= budget) {
    await notifyBudgetCrossed({ userEmail: recipient, category, budget, spentAfter })
  }
}

async function computeMonthStats(userId, monthKey) {
  const b = monthBounds(monthKey)
  if (!b) return null
  const rows = await Transaction.findAll({
    where: { userId, date: { [Op.between]: [b.start, b.end] } },
    attributes: ['type', 'category', 'amount'],
  })
  let totalIncome = 0
  let totalExpenses = 0
  const expenseByCategory = {}
  for (const r of rows) {
    const a = Number(r.amount)
    if (r.type === 'income') totalIncome += a
    else {
      totalExpenses += a
      expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + a
    }
  }
  let topCategory = null
  let topAmount = 0
  for (const [cat, amt] of Object.entries(expenseByCategory)) {
    if (amt > topAmount) {
      topAmount = amt
      topCategory = cat
    }
  }
  const totalSavings = totalIncome - totalExpenses
  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])
  return { totalExpenses, totalIncome, totalSavings, topCategory, topAmount, sortedCategories }
}

function pctChange(prev, curr) {
  if (prev === 0 && curr === 0) return 0
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
}

async function notifyMonthlySummaryForUser(userId, userEmail, monthKey, detailedSummaryEmails) {
  const prevKey = (() => {
    const [y, m] = monthKey.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    const py = d.getFullYear()
    const pm = d.getMonth() + 1
    return `${py}-${String(pm).padStart(2, '0')}`
  })()

  const curr = await computeMonthStats(userId, monthKey)
  const prev = await computeMonthStats(userId, prevKey)
  if (!curr) return

  const expenseDelta = prev ? pctChange(prev.totalExpenses, curr.totalExpenses) : null
  const savingsDelta = prev ? curr.totalSavings - prev.totalSavings : null

  const lines = [
    `Monthly finance summary — ${monthKey}`,
    '',
    `Total expenses: ${formatInr(curr.totalExpenses)}`,
    curr.topCategory
      ? `Top spending category: ${curr.topCategory} (${formatInr(curr.topAmount)})`
      : 'Top spending category: — (no expenses this month)',
    `Total savings (income − expenses): ${formatInr(curr.totalSavings)}`,
    '',
    'Compared to previous month:',
    prev
      ? `  Previous month expenses: ${formatInr(prev.totalExpenses)}`
      : '  (No data for previous month)',
  ]
  if (expenseDelta != null && Number.isFinite(expenseDelta)) {
    const sign = expenseDelta > 0 ? 'up' : expenseDelta < 0 ? 'down' : 'unchanged'
    lines.push(`  Expenses vs previous month: ${sign} ${Math.abs(Math.round(expenseDelta))}%`)
  } else if (prev && prev.totalExpenses === 0 && curr.totalExpenses > 0) {
    lines.push('  Expenses vs previous month: increased from zero')
  }
  if (prev && savingsDelta != null) {
    lines.push(`  Savings vs previous month: ${savingsDelta >= 0 ? '+' : ''}${formatInr(savingsDelta)}`)
  }

  if (detailedSummaryEmails) {
    lines.push('', 'Detailed breakdown:')
    if (!curr.sortedCategories.length) {
      lines.push('  No expense categories recorded this month.')
    } else {
      for (const [cat, amt] of curr.sortedCategories) {
        const share = curr.totalExpenses > 0 ? Math.round((amt / curr.totalExpenses) * 100) : 0
        lines.push(`  - ${cat}: ${formatInr(amt)} (${share}% of expenses)`)
      }
    }
    lines.push(`  Total income: ${formatInr(curr.totalIncome)}`)
  }

  const subject = `Your ${monthKey} finance summary`
  await sendMail({ to: userEmail, subject, text: lines.join('\n') })
}

export async function sendMonthlySummaryNowForUser(userId, monthKey) {
  if (!isEmailConfigured()) {
    const err = new Error('Email is not configured on server')
    err.code = 'EMAIL_NOT_CONFIGURED'
    throw err
  }
  const user = await User.findByPk(userId, { attributes: ['id', 'email', 'detailedSummaryEmails'] })
  if (!user) {
    const err = new Error('User not found')
    err.code = 'USER_NOT_FOUND'
    throw err
  }
  const requestedMonth = monthKey || new Date().toISOString().slice(0, 7)
  await notifyMonthlySummaryForUser(
    user.id,
    user.email,
    requestedMonth,
    Boolean(user.detailedSummaryEmails),
  )
}

/**
 * Sends one summary email per user for `monthKey` if not already sent.
 * Intended to run on the 1st of each month for the previous calendar month.
 */
export async function runMonthlySummaryJob(monthKey = previousMonthKey()) {
  if (!isEmailConfigured()) return
  const users = await User.findAll({ attributes: ['id', 'email', 'detailedSummaryEmails'] })
  for (const u of users) {
    const existing = await SentMonthlySummary.findOne({
      where: { userId: u.id, monthKey },
    })
    if (existing) continue
    try {
      await notifyMonthlySummaryForUser(
        u.id,
        u.email,
        monthKey,
        Boolean(u.detailedSummaryEmails),
      )
      await SentMonthlySummary.create({ userId: u.id, monthKey })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Monthly summary failed for user ${u.id}`, err)
    }
  }
}
