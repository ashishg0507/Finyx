import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Budget } from '../models/index.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const monthKey = String(req.query.month || '').slice(0, 7)
  if (!monthKey) return res.status(400).json({ error: 'month query param required (YYYY-MM)' })

  const rows = await Budget.findAll({
    where: { userId: req.user.id, monthKey },
  })

  const budgets = {}
  rows.forEach((r) => {
    budgets[r.category] = Number(r.amount)
  })

  res.json({ monthKey, budgets })
})

router.put('/', async (req, res) => {
  const monthKey = String(req.query.month || '').slice(0, 7)
  if (!monthKey) return res.status(400).json({ error: 'month query param required (YYYY-MM)' })

  const { budgets } = req.body || {}
  if (!budgets || typeof budgets !== 'object') return res.status(400).json({ error: 'budgets object required' })

  const entries = Object.entries(budgets)
    .filter(([category, amount]) => category && Number(amount) >= 0)
    .map(([category, amount]) => ({
      userId: req.user.id,
      monthKey,
      category: String(category),
      amount: Number(amount),
    }))

  // Upsert each category budget for the month
  await Promise.all(
    entries.map((e) =>
      Budget.upsert(e),
    ),
  )

  res.json({ ok: true })
})

export default router

