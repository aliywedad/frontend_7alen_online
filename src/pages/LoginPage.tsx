import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/ui/Toast'
import { Spinner } from '../components/ui/Spinner'
import { API_URL } from '../constants'

export default function LoginPage() {
  const { token, login } = useAuth()
  const { toast, notify } = useToast()
  const [phone,    setPhone]    = useState('+22200000000')
  const [password, setPassword] = useState('password123')
  const [loading,  setLoading]  = useState(false)

  if (token) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const json = await res.json() as { token?: string; user?: { role: string; name: string; adminPermissions?: string[] }; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Login failed')
      if (json.user?.role !== 'ADMIN' && json.user?.role !== 'SUPERADMIN') throw new Error('This account is not an admin')
      login(json.token!, json.user!.name, json.user!.role, json.user!.adminPermissions ?? [])
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ background: 'linear-gradient(135deg, #0f0500 0%, #1a0800 50%, #0a0200 100%)' }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
    >
      <Toast toast={toast} />

      {/* Decorative background blobs */}
      <div
        style={{ background: 'rgba(253,174,0,0.18)', filter: 'blur(80px)', width: 400, height: 400 }}
        className="absolute -top-32 -left-32 rounded-full pointer-events-none"
      />
      <div
        style={{ background: 'rgba(209,49,0,0.15)', filter: 'blur(80px)', width: 320, height: 320 }}
        className="absolute -bottom-28 -right-20 rounded-full pointer-events-none"
      />

      {/* Card wrapper with glow border */}
      <div className="relative w-full" style={{ maxWidth: 420 }}>
        {/* Glow ring */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(253,174,0,0.35), transparent, rgba(209,49,0,0.25))',
            borderRadius: 28,
            inset: -1,
            position: 'absolute',
            filter: 'blur(1px)',
          }}
        />

        {/* Glass card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            position: 'relative',
          }}
        >
          {/* Amber + red accent bar */}
          <div style={{ height: 3, background: 'linear-gradient(to right, #fdae00, #fcd34d, #d13100)' }} />

          <div style={{ padding: '36px 32px 32px' }}>
            {/* Logo + branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
              <div
                style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <img src="/logo.png" alt="7alan" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              </div>
              <span
                style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.25em',
                  color: '#fdae00', textTransform: 'uppercase', marginBottom: 6,
                }}
              >
                Admin Portal
              </span>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Control Center
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
                Manage orders, restaurants, drivers and platform settings.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { void submit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)' }}
                >
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+22200000000"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(253,174,0,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(253,174,0,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)' }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(253,174,0,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(253,174,0,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  background: loading ? 'rgba(253,174,0,0.6)' : 'linear-gradient(135deg, #fdae00 0%, #fbbf24 100%)',
                  color: '#0f0500',
                  fontWeight: 800,
                  fontSize: 14,
                  padding: '13px 0',
                  borderRadius: 14,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  width: '100%',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(253,174,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.15s, transform 0.1s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading ? (
                  <>
                    <Spinner size={16} />
                    Signing in…
                  </>
                ) : (
                  'Sign in →'
                )}
              </button>
            </form>

            {/* Seed hint */}
            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '20px 0 0' }}>
              Seed: +22200000000 / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
