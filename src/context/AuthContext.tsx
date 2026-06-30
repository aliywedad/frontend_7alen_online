import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { API_URL } from '../constants'

type AuthCtx = {
  token: string
  adminName: string
  role: string
  permissions: string[]
  login: (token: string, name: string, role: string, permissions: string[]) => void
  logout: () => void
  hasPermission: (key: string) => boolean
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,       setToken]       = useState(() => localStorage.getItem('7alan-admin-token') ?? '')
  const [adminName,   setAdminName]   = useState(() => localStorage.getItem('7alan-admin-name') ?? 'Admin')
  const [role,        setRole]        = useState(() => localStorage.getItem('7alan-admin-role') ?? 'ADMIN')
  const [permissions, setPermissions] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('7alan-admin-permissions') ?? '[]') } catch { return [] }
  })

  const login = (t: string, name: string, r: string, perms: string[]) => {
    localStorage.setItem('7alan-admin-token',       t)
    localStorage.setItem('7alan-admin-name',        name)
    localStorage.setItem('7alan-admin-role',        r)
    localStorage.setItem('7alan-admin-permissions', JSON.stringify(perms))
    setToken(t)
    setAdminName(name)
    setRole(r)
    setPermissions(perms)
  }

  const logout = () => {
    localStorage.removeItem('7alan-admin-token')
    localStorage.removeItem('7alan-admin-name')
    localStorage.removeItem('7alan-admin-role')
    localStorage.removeItem('7alan-admin-permissions')
    setToken('')
    setAdminName('Admin')
    setRole('ADMIN')
    setPermissions([])
  }

  const hasPermission = (key: string): boolean => {
    if (role === 'SUPERADMIN') return true
    return permissions.includes(key)
  }

  // Refresh role + permissions from DB on every page load so changes take
  // effect without requiring a re-login (JWT may carry stale values).
  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { user?: { role: string; adminPermissions?: string[] } } | null) => {
        if (!data?.user) return
        const freshRole  = data.user.role
        const freshPerms = data.user.adminPermissions ?? []
        if (freshRole !== role || JSON.stringify(freshPerms) !== JSON.stringify(permissions)) {
          localStorage.setItem('7alan-admin-role',        freshRole)
          localStorage.setItem('7alan-admin-permissions', JSON.stringify(freshPerms))
          setRole(freshRole)
          setPermissions(freshPerms)
        }
      })
      .catch(() => { /* network error — keep existing values */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <AuthContext.Provider value={{ token, adminName, role, permissions, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
