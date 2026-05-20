import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

const isTestMode = process.env.FINYX_TEST_MODE === '1'

if (!isTestMode) {
  dotenv.config()
}

function parseDatabaseUrl(url) {
  const parsed = new URL(url)
  return {
    database: parsed.pathname.replace(/^\//, ''),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
  }
}

function getDbConfig() {
  if (isTestMode) {
    return { testMode: true }
  }

  const url = process.env.DATABASE_URL || process.env.MYSQL_URL
  if (url) return { ...parseDatabaseUrl(url), testMode: false }

  return {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    testMode: false,
  }
}

function getDialectOptions() {
  const useSsl =
    String(process.env.DB_SSL || '').toLowerCase() === 'true' ||
    String(process.env.MYSQL_SSL || '').toLowerCase() === 'true'

  if (!useSsl) return {}

  return {
    ssl: {
      rejectUnauthorized: false,
    },
  }
}

const db = getDbConfig()

export const sequelize = db.testMode
  ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
  : new Sequelize(db.database, db.username, db.password, {
      host: db.host,
      port: db.port,
      dialect: 'mysql',
      logging: false,
      dialectOptions: getDialectOptions(),
    })

export async function testDbConnection() {
  await sequelize.authenticate()
}
