import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { ALL_PERMISSIONS } from '../constants'
import type { User } from '../types'

const PERM_LABELS: Record<string, string> = {
  orders: 'Orders', restaurants: 'Restaurants', drivers: 'Drivers',
  users: 'Users', courier: 'Courier', coupons: 'Coupons',
  banners: 'Banners', reviews: 'Reviews', notifications: 'Notifications',
  analytics: 'Analytics', settings: 'Settings',
}

const PERM_DESC: Record<string, string> = {
  orders: 'View and manage customer orders',
  restaurants: 'Manage restaurant listings and menus',
  drivers: 'Monitor the driver fleet',
  users: 'View and manage user accounts',
  courier: 'Manage courier/package requests',
  coupons: 'Create and delete discount codes',
  banners: 'Manage promotional banners',
  reviews: 'View customer reviews',
  notifications: 'Send push notifications',
  analytics: 'View platform analytics',
  settings: 'Edit platform settings',
}

export default function UserPermissionsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { toast, notify } = useToast()

  const [user,    setUser]    = useState<User | null>(null)
  const [perms,   setPerms]   = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiFetch<{ users: User[] }>(`/admin/users?role=ALL`, token)
      .then(({ users }) => {
        const u = users.find((u) => u.id === id)
        if (u) { setUser(u); setPerms(u.adminPermissions ?? []) }
        else notify('error', 'User not found')
      })
      .catch(() => notify('error', 'Failed to load user'))
      .finally(() => setLoading(false))
  }, [id, token, notify])

  const toggle = (key: string) =>
    setPerms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key])

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      await apiFetch(`/admin/users/${user.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ adminPermissions: perms }),
      })
      notify('success', 'Permissions saved')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page flex items-center justify-center" style={{ minHeight: 200 }}>
        <Spinner size={28} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title={`Permissions — ${user.name}`}
        sub={`${user.phone} · Admin account`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/users')}>
              <ArrowLeft size={14} /> Back to Users
            </button>
            <button className="btn-primary" onClick={() => void save()} disabled={saving}>
              {saving ? <Spinner size={13} /> : <ShieldCheck size={14} />}
              Save permissions
            </button>
          </>
        }
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
        <ShieldCheck size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Admin access control</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Overview is always accessible to all admins. The selections below control every other section.
            Changes take effect on the user's next login.
          </p>
        </div>
      </div>

      <Panel title="Page access">
        <div
          className="grid gap-3 p-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
        >
          {ALL_PERMISSIONS.map((key) => {
            const on = perms.includes(key)
            return (
              <label
                key={key}
                className="flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none"
                style={{
                  borderColor: on ? '#f59e0b' : '#e5e7eb',
                  background: on ? '#fffbeb' : '#fafafa',
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(key)}
                  className="mt-0.5 accent-amber-500 shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{PERM_LABELS[key]}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{PERM_DESC[key]}</p>
                </div>
              </label>
            )
          })}
        </div>

        <div className="flex items-center gap-3 px-5 pb-5">
          <button
            className="btn-secondary"
            onClick={() => setPerms([...ALL_PERMISSIONS])}
          >
            Select all
          </button>
          <button
            className="btn-secondary"
            onClick={() => setPerms([])}
          >
            Clear all
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {perms.length} / {ALL_PERMISSIONS.length} sections enabled
          </span>
        </div>
      </Panel>
    </div>
  )
}
