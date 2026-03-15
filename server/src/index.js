import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { sequelize, testDbConnection } from './db.js'
import './models/index.js'
import authRoutes from './routes/auth.js'
import transactionsRoutes from './routes/transactions.js'
import budgetsRoutes from './routes/budgets.js'
import goalsRoutes from './routes/goals.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/budgets', budgetsRoutes)
app.use('/api/goals', goalsRoutes)

const port = Number(process.env.PORT || 4000)

async function start() {
  await testDbConnection()
  await sequelize.sync()
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', err)
  process.exit(1)
})

