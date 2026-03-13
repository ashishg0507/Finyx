import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [user, setUser] = useState(null)
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
        if (!cancelled) setUser(data.user)
      } catch {
        setToken('')
        setTokenState('')
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      async signup(email, password) {
        const data = await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setToken(data.token)
        setTokenState(data.token)
        setUser(data.user)
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
        return data.user
      },
      signout() {
        setToken('')
        setTokenState('')
        setUser(null)
      },
    }),
    [token, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

