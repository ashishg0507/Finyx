import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Subscription, User } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { sendMonthlySummaryNowForUser } from '../services/financeAlerts.js'

const router = Router()

const signToken = (user) => {
  const payload = { sub: user.id, email: user.email }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const toAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  detailedSummaryEmails: Boolean(user.detailedSummaryEmails),
})

router.post('/signup', async (req, res) => {
  const { email, password, detailedSummaryEmails } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = await User.findOne({ where: { email: normalizedEmail } })
  if (existing) return res.status(409).json({ error: 'Email already in use' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    detailedSummaryEmails: Boolean(detailedSummaryEmails),
  })
  const token = signToken(user)
  return res.status(201).json({ token, user: toAuthUser(user) })
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const normalizedEmail = String(email).trim().toLowerCase()
  const user = await User.findOne({ where: { email: normalizedEmail } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await bcrypt.compare(String(password), user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = signToken(user)
  return res.json({ token, user: toAuthUser(user) })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'email', 'createdAt', 'detailedSummaryEmails'],
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  const subscription = await Subscription.findOne({
    where: { userId: req.user.id, isActive: true, status: 'paid' },
    order: [['paidAt', 'DESC']],
  })
  return res.json({
    user,
    subscription: subscription ? { planId: subscription.planId, status: subscription.status } : null,
  })
})

router.patch('/preferences/email', requireAuth, async (req, res) => {
  const { detailedSummaryEmails } = req.body || {}
  if (typeof detailedSummaryEmails !== 'boolean') {
    return res.status(400).json({ error: 'detailedSummaryEmails must be boolean' })
  }
  const user = await User.findByPk(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  user.detailedSummaryEmails = detailedSummaryEmails
  await user.save()
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      detailedSummaryEmails: Boolean(user.detailedSummaryEmails),
    },
  })
})

router.post('/summary/send-now', requireAuth, async (req, res) => {
  const { monthKey } = req.body || {}
  if (monthKey != null && !/^\d{4}-\d{2}$/.test(String(monthKey))) {
    return res.status(400).json({ error: 'monthKey must be in YYYY-MM format' })
  }
  try {
    await sendMonthlySummaryNowForUser(req.user.id, monthKey ? String(monthKey) : undefined)
    return res.json({ ok: true, message: 'Summary email sent' })
  } catch (err) {
    if (err?.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Email service is not configured' })
    }
    if (err?.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' })
    }
    // eslint-disable-next-line no-console
    console.error('Send summary now failed', err)
    const msg = String(err?.message || '')
    if (msg) {
      return res.status(500).json({ error: `Failed to send summary email: ${msg}` })
    }
    return res.status(500).json({ error: 'Failed to send summary email' })
  }
})

export default router

