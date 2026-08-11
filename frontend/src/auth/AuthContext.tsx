import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { clearToken, get, getToken, post, setToken } from '../api/client'
import type { AuthResponse, Role, UserInfo } from '../api/types'

interface AuthContextValue {
  user: UserInfo | null
  loading: boolean
  login: (username: string, password: string) => Promise<UserInfo>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    get<AuthResponse>('/api/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await post<AuthResponse>('/api/auth/login', { username, password })
    setToken(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export function homeForRole(role: Role): string {
  if (role === 'ADMIN') return '/admin'
  if (role === 'STUDENT') return '/student'
  return '/teacher'
}
