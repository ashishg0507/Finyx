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

function isLikelyPlaceholder(value) {
  if (!value) return true
  const normalized = String(value).trim().toLowerCase()
  return (
    normalized.includes('your_') ||
    normalized.includes('replace') ||
    normalized.includes('example') ||
    normalized === 'changeme'
  )
}

function getPaymentConfig() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim()
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim()
  const missing = []

  if (!keyId || isLikelyPlaceholder(keyId)) missing.push('RAZORPAY_KEY_ID')
  if (!keySecret || isLikelyPlaceholder(keySecret)) missing.push('RAZORPAY_KEY_SECRET')

  return {
    keyId,
    keySecret,
    missing,
    isConfigured: missing.length === 0,
    mode: keyId.startsWith('rzp_live_') ? 'live' : keyId.startsWith('rzp_test_') ? 'test' : 'unknown',
  }
}

function getRazorpay() {
  const cfg = getPaymentConfig()
  if (!cfg.isConfigured) {
    const err = new Error(`Missing/invalid env vars: ${cfg.missing.join(', ')}`)
    err.code = 'PAYMENT_CONFIG_ERROR'
    throw err
  }

  return new Razorpay({
    key_id: cfg.keyId,
    key_secret: cfg.keySecret,
  })
}

router.get('/config-status', (_req, res) => {
  const cfg = getPaymentConfig()
  const maskedKeyId = cfg.keyId ? `${cfg.keyId.slice(0, 8)}...` : null

  return res.json({
    ok: true,
    paymentsConfigured: cfg.isConfigured,
    mode: cfg.mode,
    keyIdPreview: maskedKeyId,
    missing: cfg.missing,
  })
})

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
      keyId: getPaymentConfig().keyId,
      planId: plan.planId,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Razorpay create-order failed:', {
      code: e?.code,
      statusCode: e?.statusCode,
      description: e?.error?.description || e?.description,
      message: e?.message,
    })

    if (e?.code === 'PAYMENT_CONFIG_ERROR') {
      return res.status(500).json({
        error:
          'Payments are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env and restart backend.',
      })
    }

    if (e?.statusCode === 401 || e?.statusCode === 400) {
      return res.status(502).json({
        error:
          'Razorpay rejected credentials. Check if key id/secret are valid and from the same mode (test/live).',
      })
    }

    return res.status(500).json({ error: e?.message || 'Failed to create order' })
  }
})

router.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' })
  }

  try {
    const cfg = getPaymentConfig()
    if (!cfg.keySecret) {
      return res.status(500).json({
        error:
          'Server misconfigured for payment verification. Set RAZORPAY_KEY_SECRET in server/.env and restart backend.',
      })
    }

    // Manual signature verification to avoid SDK differences.
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expected = crypto.createHmac('sha256', cfg.keySecret).update(body).digest('hex')
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

