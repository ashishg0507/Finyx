import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getAllowedOrigins() {
  const fromEnv = parseCsv(process.env.CORS_ORIGINS)
  if (!fromEnv.length) return true
  return fromEnv
}

function createIpBlocker() {
  const blockedIps = new Set(parseCsv(process.env.BLOCKED_IPS))
  return (req, res, next) => {
    if (!blockedIps.size) return next()
    const ip = req.ip || req.socket?.remoteAddress || ''
    if (blockedIps.has(ip)) {
      return res.status(403).json({ error: 'Access denied' })
    }
    return next()
  }
}

function createRequestSizeGuard() {
  const maxBodyKb = Number(process.env.MAX_BODY_KB || 100)
  const limitKb = Number.isFinite(maxBodyKb) && maxBodyKb > 0 ? maxBodyKb : 100
  return `${limitKb}kb`
}

export function buildCorsConfig() {
  return {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
}

export function applyFirewall(app) {
  app.disable('x-powered-by')
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 1))

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  )

  app.use(createIpBlocker())

  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
      max: Number(process.env.RATE_LIMIT_MAX || 300),
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, try again later.' },
      skip: (req) => req.path === '/api/health',
    }),
  )

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
      max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many auth attempts, try again later.' },
    }),
  )

  return createRequestSizeGuard()
}
