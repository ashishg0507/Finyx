import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Goal, GoalContribution } from '../models/index.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const goals = await Goal.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  })

  const goalIds = goals.map((g) => g.id)
  const contributions = goalIds.length
    ? await GoalContribution.findAll({
        where: { userId: req.user.id, goalId: goalIds },
        order: [['date', 'DESC'], ['id', 'DESC']],
      })
    : []

  const byGoal = new Map()
  contributions.forEach((c) => {
    const arr = byGoal.get(c.goalId) || []
    arr.push(c)
    byGoal.set(c.goalId, arr)
  })

  res.json({
    goals: goals.map((g) => ({
      ...g.toJSON(),
      contributions: (byGoal.get(g.id) || []).map((c) => c.toJSON()),
    })),
  })
})

router.post('/', async (req, res) => {
  const { name, targetAmount, currentAmount, dueDate, priority } = req.body || {}
  if (!name || !targetAmount) return res.status(400).json({ error: 'name and targetAmount required' })
  const target = Number(targetAmount)
  const current = Number(currentAmount || 0)
  if (!Number.isFinite(target) || target <= 0) return res.status(400).json({ error: 'Invalid targetAmount' })
  if (!Number.isFinite(current) || current < 0) return res.status(400).json({ error: 'Invalid currentAmount' })

  const goal = await Goal.create({
    userId: req.user.id,
    name: String(name).trim(),
    targetAmount: target,
    currentAmount: Math.min(current, target),
    dueDate: dueDate || null,
    priority: priority === 'low' || priority === 'high' || priority === 'medium' ? priority : 'medium',
  })

  res.status(201).json({ goal: goal.toJSON() })
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  const deleted = await Goal.destroy({ where: { id, userId: req.user.id } })
  if (!deleted) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

router.post('/:id/contributions', async (req, res) => {
  const goalId = Number(req.params.id)
  if (!goalId) return res.status(400).json({ error: 'Invalid goal id' })

  const goal = await Goal.findOne({ where: { id: goalId, userId: req.user.id } })
  if (!goal) return res.status(404).json({ error: 'Goal not found' })

  const { amount, date, note } = req.body || {}
  const num = Number(amount)
  if (!Number.isFinite(num) || num <= 0) return res.status(400).json({ error: 'Invalid amount' })
  if (!date) return res.status(400).json({ error: 'date required' })

  const contrib = await GoalContribution.create({
    userId: req.user.id,
    goalId,
    amount: num,
    date,
    note: note ? String(note).trim() : null,
  })

  const nextAmount = Math.min(Number(goal.currentAmount) + num, Number(goal.targetAmount))
  await goal.update({ currentAmount: nextAmount })

  res.status(201).json({ contribution: contrib.toJSON(), goal: goal.toJSON() })
})

export default router

