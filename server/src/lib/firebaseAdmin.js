import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function formatPrivateKey(value = '') {
  return value.replace(/\\n/g, '\n')
}

function getFirebaseAdminApp() {
  if (getApps().length) return getApp()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY || '')

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
  }

  if (projectId) {
    return initializeApp({ projectId })
  }

  return null
}

export async function verifyFirebaseIdToken(idToken) {
  const app = getFirebaseAdminApp()
  if (!app) return null

  try {
    const auth = getAuth(app)
    return await auth.verifyIdToken(idToken)
  } catch {
    return null
  }
}
