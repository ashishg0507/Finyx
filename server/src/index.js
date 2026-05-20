import dotenv from 'dotenv'
import cron from 'node-cron'
import { DataTypes } from 'sequelize'
import { sequelize, testDbConnection } from './db.js'
import './models/index.js'
import { createApp } from './app.js'
import { runMonthlySummaryJob } from './services/financeAlerts.js'
import { isEmailConfigured } from './services/mailer.js'

dotenv.config()

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

  const app = createApp()
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
