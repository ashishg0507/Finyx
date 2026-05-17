import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api/client'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, hasFirebaseConfig } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!hasFirebaseConfig || !auth) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return

      if (!firebaseUser) {
        setToken('')
        setTokenState('')
        setUser(null)
        setSubscription(null)
        setLoading(false)
        return
      }

      const idToken = await firebaseUser.getIdToken()
      if (cancelled) return

      setToken(idToken)
      setTokenState(idToken)

      try {
        const data = await apiFetch('/api/auth/me')
        if (!cancelled) {
          setUser(data.user)
          setSubscription(data.subscription || null)
        }
      } catch {
        if (!cancelled) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            createdAt: firebaseUser.metadata?.creationTime || null,
            detailedSummaryEmails: false,
          })
          setSubscription(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const refreshMe = async () => {
    const t = getToken()
    if (!t) {
      setUser(null)
      setSubscription(null)
      return null
    }

    const data = await apiFetch('/api/auth/me')
    setUser(data.user)
    setSubscription(data.subscription || null)
    return data
  }

  const value = useMemo(
    () => ({
      token,
      user,
      subscription,
      loading,
      refreshMe,
      async signup(email, password, detailedSummaryEmails = false) {
        if (!hasFirebaseConfig || !auth) throw new Error('Firebase is not configured')

        const cred = await createUserWithEmailAndPassword(auth, email, password)
        const idToken = await cred.user.getIdToken()
        setToken(idToken)
        setTokenState(idToken)

        if (detailedSummaryEmails) {
          await apiFetch('/api/auth/preferences/email', {
            method: 'PATCH',
            body: JSON.stringify({ detailedSummaryEmails: true }),
          })
        }

        const data = await refreshMe()
        return data?.user || null
      },
      async signin(email, password) {
        if (!hasFirebaseConfig || !auth) throw new Error('Firebase is not configured')

        const cred = await signInWithEmailAndPassword(auth, email, password)
        const idToken = await cred.user.getIdToken()
        setToken(idToken)
        setTokenState(idToken)

        const data = await refreshMe()
        return data?.user || null
      },
      async signinWithGoogle() {
        if (!hasFirebaseConfig || !auth) throw new Error('Firebase is not configured')

        const provider = new GoogleAuthProvider()
        const cred = await signInWithPopup(auth, provider)
        const idToken = await cred.user.getIdToken()
        setToken(idToken)
        setTokenState(idToken)

        const data = await refreshMe()
        return data?.user || null
      },
      async signout() {
        if (auth) await signOut(auth)
        setToken('')
        setTokenState('')
        setUser(null)
        setSubscription(null)
      },
    }),
    [token, user, subscription, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

