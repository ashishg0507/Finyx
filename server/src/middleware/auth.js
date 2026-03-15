import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return res.status(401).json({ error: 'Missing token' })

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET)
    req.user = { id: payload.sub, email: payload.email }
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

