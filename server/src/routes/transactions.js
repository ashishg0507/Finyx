import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Transaction } from '../models/index.js'
import { notifyAfterExpense } from '../services/financeAlerts.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const items = await Transaction.findAll({
    where: { userId: req.user.id },
    order: [['date', 'DESC'], ['id', 'DESC']],
  })
  res.json({ transactions: items })
})

router.post('/', async (req, res) => {
  const { type, amount, description, category, date } = req.body || {}
  if (!type || !amount || !description || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  if (type !== 'income' && type !== 'expense') return res.status(400).json({ error: 'Invalid type' })
  const num = Number(amount)
  if (!Number.isFinite(num) || num <= 0) return res.status(400).json({ error: 'Invalid amount' })

  const created = await Transaction.create({
    userId: req.user.id,
    type,
    amount: num,
    description: String(description).trim(),
    category: String(category).trim(),
    date,
  })
  notifyAfterExpense({
    userId: req.user.id,
    userEmail: req.user.email,
    transaction: created,
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Expense notification email failed', err)
  })
  return res.status(201).json({ transaction: created })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  const deleted = await Transaction.destroy({ where: { id, userId: req.user.id } })
  if (!deleted) return res.status(404).json({ error: 'Not found' })
  return res.json({ ok: true })
})

export default router

