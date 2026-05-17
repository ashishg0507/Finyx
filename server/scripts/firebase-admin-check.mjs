import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverDir = path.resolve(__dirname, '..')

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
    out[key] = trimmed.slice(idx + 1).trim()
  }
  return out
}

function printStatus(ok, label, details = '') {
  const icon = ok ? 'OK' : 'FAIL'
  console.log(`[${icon}] ${label}${details ? ` - ${details}` : ''}`)
}

function main() {
  console.log('Firebase admin check (backend)')

  let failed = false
  const envPath = path.join(serverDir, '.env')
  const env = parseEnvFile(envPath)

  const adminInstalled = fs.existsSync(path.join(serverDir, 'node_modules', 'firebase-admin'))
  printStatus(adminInstalled, 'firebase-admin package installed')
  if (!adminInstalled) failed = true

  const hasProjectId = Boolean(env.FIREBASE_PROJECT_ID)
  printStatus(hasProjectId, 'FIREBASE_PROJECT_ID is set')
  if (!hasProjectId) failed = true

  if (failed) {
    console.log('\nFirebase admin check found issues.')
    process.exit(1)
  }

  console.log('\nFirebase admin check passed.')
}

main()
