import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import transactionsRoutes from './routes/transactions.js'
import budgetsRoutes from './routes/budgets.js'
import goalsRoutes from './routes/goals.js'
import paymentsRoutes from './routes/payments.js'
import { applyFirewall, buildCorsConfig } from './middleware/firewall.js'

/** Express app without listen(), cron, or DB sync — safe for tests. */
export function createApp() {
  const app = express()
  const jsonLimit = applyFirewall(app)

  app.use(cors(buildCorsConfig()))
  app.use(express.json({ limit: jsonLimit }))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRoutes)
  app.use('/api/transactions', transactionsRoutes)
  app.use('/api/budgets', budgetsRoutes)
  app.use('/api/goals', goalsRoutes)
  app.use('/api/payments', paymentsRoutes)

  return app
}
