import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { DataTypes } from 'sequelize'
import { sequelize, testDbConnection } from './db.js'
import './models/index.js'
import authRoutes from './routes/auth.js'
import transactionsRoutes from './routes/transactions.js'
import budgetsRoutes from './routes/budgets.js'
import goalsRoutes from './routes/goals.js'
import paymentsRoutes from './routes/payments.js'
import { runMonthlySummaryJob } from './services/financeAlerts.js'
import { isEmailConfigured } from './services/mailer.js'
import { applyFirewall, buildCorsConfig } from './middleware/firewall.js'

dotenv.config()

const app = express()
const jsonLimit = applyFirewall(app)

app.use(
  cors(buildCorsConfig()),
)
app.use(express.json({ limit: jsonLimit }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/budgets', budgetsRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/payments', paymentsRoutes)

const port = Number(process.env.PORT || 4000)

async function ensureSchemaAdjustments() {
  const qi = sequelize.getQueryInterface()
  const userTable = await qi.describeTable('users')
  if (!userTable.detailedSummaryEmails) {
    await qi.addColumn('users', 'detailedSummaryEmails', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  }
}

function scheduleMonthlySummaryEmail() {
  if (String(process.env.MONTHLY_SUMMARY_CRON || 'true').toLowerCase() === 'false') return
  if (!isEmailConfigured()) return
  const cronOpts = {}
  if (process.env.CRON_TZ) cronOpts.timezone = process.env.CRON_TZ
  // 08:00 on the 1st of each month (local server time unless CRON_TZ is set)
  cron.schedule(
    '0 8 1 * *',
    () => {
      runMonthlySummaryJob().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Monthly finance summary job failed', err)
      })
    },
    cronOpts,
  )
}

async function start() {
  await testDbConnection()
  await sequelize.sync()
  await ensureSchemaAdjustments()
  scheduleMonthlySummaryEmail()
  app.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', err)
  process.exit(1)
})

