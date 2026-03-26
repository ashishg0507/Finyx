import { Router } from 'express'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { requireAuth } from '../middleware/auth.js'
import { Subscription } from '../models/index.js'

const router = Router()

const planCatalog = {
  pro: { planId: 'pro', planLabel: 'Pro', amountINRPaise: 59900 },
  elite: { planId: 'elite', planLabel: 'Elite', amountINRPaise: 99900 },
}

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET env vars')
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

router.post('/create-order', requireAuth, async (req, res) => {
  const { planId } = req.body || {}
  const plan = planCatalog[planId]
  if (!plan) return res.status(400).json({ error: 'Invalid planId' })

  try {
    const razorpay = getRazorpay()

    const order = await razorpay.orders.create({
      amount: plan.amountINRPaise,
      currency: 'INR',
      receipt: `finyx_${req.user.id}_${plan.planId}_${Date.now()}`,
      payment_capture: 1,
      notes: { userId: String(req.user.id), planId: plan.planId },
    })

    await Subscription.create({
      userId: req.user.id,
      planId: plan.planId,
      status: 'created',
      razorpayOrderId: order.id,
      isActive: false,
    })

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planId: plan.planId,
    })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to create order' })
  }
})

router.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' })
  }

  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Server misconfigured (missing RAZORPAY_KEY_SECRET)' })
    }

    // Manual signature verification to avoid SDK differences.
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
    const sig = String(razorpay_signature)

    const isValid =
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Razorpay signature' })
    }

    const sub = await Subscription.findOne({
      where: { userId: req.user.id, razorpayOrderId: razorpay_order_id },
    })

    if (!sub) {
      // If we can't find the order in DB, create a paid record so the user is unblocked.
      const created = await Subscription.create({
        userId: req.user.id,
        planId: 'unknown',
        status: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: sig,
        isActive: true,
        paidAt: new Date(),
      })
      return res.json({ ok: true, subscription: { planId: created.planId, status: created.status } })
    }

    await Subscription.update(
      { isActive: false },
      { where: { userId: req.user.id, isActive: true } },
    )

    sub.status = 'paid'
    sub.razorpayPaymentId = razorpay_payment_id
    sub.razorpaySignature = sig
    sub.isActive = true
    sub.paidAt = new Date()
    await sub.save()

    return res.json({ ok: true, subscription: { planId: sub.planId, status: sub.status } })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to verify payment' })
  }
})

export default router

