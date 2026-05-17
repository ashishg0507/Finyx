import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { verifyFirebaseIdToken } from '../lib/firebaseAdmin.js'

async function resolveUserFromFirebase(decoded) {
  const email = String(decoded?.email || '').trim().toLowerCase()
  if (!email) return null

  const [user] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      // Firebase stores passwords, so this sentinel is never used for auth.
      passwordHash: 'firebase-auth',
      detailedSummaryEmails: false,
    },
  })

  return { id: user.id, email: user.email }
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return res.status(401).json({ error: 'Missing token' })

  const token = match[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, email: payload.email }
    return next()
  } catch {
    const decoded = await verifyFirebaseIdToken(token)
    if (!decoded) return res.status(401).json({ error: 'Invalid token' })

    const linkedUser = await resolveUserFromFirebase(decoded)
    if (!linkedUser) return res.status(401).json({ error: 'Firebase token has no email' })

    req.user = linkedUser
    return next()
  }
}

