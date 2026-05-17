import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const out = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

async function checkApiHealth(apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/api/health`)
    return res.ok
  } catch {
    return false
  }
}

function printStatus(ok, label, details = '') {
  const icon = ok ? 'OK' : 'FAIL'
  console.log(`[${icon}] ${label}${details ? ` - ${details}` : ''}`)
}

async function main() {
  console.log('Firebase doctor (frontend + API)')

  const envPath = path.join(rootDir, '.env')
  const env = parseEnvFile(envPath)

  const requiredFirebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]

  let failed = false

  printStatus(fs.existsSync(envPath), '.env file exists', envPath)
  if (!fs.existsSync(envPath)) failed = true

  for (const key of requiredFirebaseVars) {
    const ok = Boolean(env[key])
    printStatus(ok, `${key} is set`)
    if (!ok) failed = true
  }

  const firebaseInstalled = fs.existsSync(path.join(rootDir, 'node_modules', 'firebase'))
  printStatus(firebaseInstalled, 'firebase package installed')
  if (!firebaseInstalled) failed = true

  const apiUrl = env.VITE_API_URL || 'http://localhost:4000'
  const apiHealthy = await checkApiHealth(apiUrl)
  printStatus(apiHealthy, 'backend /api/health reachable', apiUrl)
  if (!apiHealthy) failed = true

  if (failed) {
    console.log('\nFirebase doctor found issues.')
    process.exit(1)
  }

  console.log('\nFirebase doctor passed. Setup looks ready.')
}

main()
