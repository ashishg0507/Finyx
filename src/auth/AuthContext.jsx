import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const t = getToken()
      setTokenState(t)
      if (!t) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const data = await apiFetch('/api/auth/me')
        if (!cancelled) {
          setUser(data.user)
          setSubscription(data.subscription || null)
        }
      } catch {
        setToken('')
        setTokenState('')
        if (!cancelled) setUser(null)
        if (!cancelled) setSubscription(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
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
      async signup(email, password) {
        const data = await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setToken(data.token)
        setTokenState(data.token)
        setUser(data.user)
        setSubscription(null)
        return data.user
      },
      async signin(email, password) {
        const data = await apiFetch('/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setToken(data.token)
        setTokenState(data.token)
        setUser(data.user)
        setSubscription(null)
        return data.user
      },
      signout() {
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

