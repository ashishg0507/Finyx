import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Subscription, User } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const signToken = (user) => {
  const payload = { sub: user.id, email: user.email }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = await User.findOne({ where: { email: normalizedEmail } })
  if (existing) return res.status(409).json({ error: 'Email already in use' })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ email: normalizedEmail, passwordHash })
  const token = signToken(user)
  return res.status(201).json({ token, user: { id: user.id, email: user.email } })
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
  return res.json({ token, user: { id: user.id, email: user.email } })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'email', 'createdAt'] })
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

export default router

