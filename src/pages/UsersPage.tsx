import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { confirmAction, promptNumber } from '../utils/swal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Badge, BoolBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { RowActions } from '../components/ui/RowActions'
import { money, fmtDate } from '../utils/format'
import { ROLE_FILTERS, ALL_PERMISSIONS } from '../constants'
import type { User } from '../types'

function RoleModal({
  user,
  token,
  notify,
  onClose,
  onSaved,
}: {
  user: User
  token: string
  notify: (type: 'success' | 'error', msg: string) => void
  onClose: () => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<'ADMIN' | 'SUPERADMIN'>(
    user.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN'
  )
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (selected === user.role) { onClose(); return }
    setSaving(true)
    try {
      await apiFetch(`/admin/users/${user.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ role: selected }),
      })
      notify('success', `${user.name} is now ${selected === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}`)
      onSaved()
      onClose()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const ROLES = [
    {
      key: 'ADMIN' as const,
      label: 'Admin',
      sub: 'Access only to explicitly granted pages. Permissions managed per account.',
      icon: <ShieldCheck size={18} className="text-blue-500" />,
      border: selected === 'ADMIN' ? '#3b82f6' : '#e5e7eb',
      bg: selected === 'ADMIN' ? '#eff6ff' : '#fff',
    },
    {
      key: 'SUPERADMIN' as const,
      label: 'Super Admin',
      sub: 'Unrestricted access to all pages and actions, including assigning roles.',
      icon: <ShieldAlert size={18} className="text-amber-500" />,
      border: selected === 'SUPERADMIN' ? '#f59e0b' : '#e5e7eb',
      bg: selected === 'SUPERADMIN' ? '#fffbeb' : '#fff',
    },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Change Role — {user.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ paddingTop: 16, paddingBottom: 8 }}>
          <p className="text-xs text-gray-500 mb-4">
            Select the admin role for this account. Role changes take effect on next login.
          </p>

          <div className="flex flex-col gap-3 mb-2">
            {ROLES.map((r) => (
              <label
                key={r.key}
                className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                style={{ borderColor: r.border, background: r.bg }}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.key}
                  checked={selected === r.key}
                  onChange={() => setSelected(r.key)}
                  className="mt-0.5 accent-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {r.icon}
                    <span className="text-sm font-bold text-gray-800">{r.label}</span>
                    {user.role === r.key && (
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">current</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.sub}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => void save()}
            disabled={saving || selected === user.role}
          >
            {saving ? <Spinner size={13} /> : null}
            {selected === user.role ? 'No change' : `Set as ${selected === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { token, role: viewerRole } = useAuth()
  const { toast, notify } = useToast()
  const navigate = useNavigate()
  const [users,      setUsers]      = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [role,       setRole]       = useState('ALL')
  const [search,     setSearch]     = useState('')
  const [roleTarget, setRoleTarget] = useState<User | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search)}` : ''
      const { users } = await apiFetch<{ users: User[] }>(`/admin/users?role=${role}${q}`, token)
      setUsers(users)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify, role, search])

  useEffect(() => { void load() }, [load])

  const patch = async (id: string, body: Record<string, unknown>, msg: string, user?: User) => {
    if (user && 'isActive' in body) {
      const blocking = !body['isActive']
      const confirmed = await confirmAction(
        blocking ? `Block ${user.name}?` : `Unblock ${user.name}?`,
        blocking
          ? 'The user will no longer be able to log in.'
          : 'The user will be able to log in again.',
        blocking ? 'Block user' : 'Unblock',
      )
      if (!confirmed) return
    }
    try {
      await apiFetch(`/admin/users/${id}`, token, { method: 'PATCH', body: JSON.stringify(body) })
      notify('success', msg)
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const adjustWallet = async (user: User) => {
    const n = await promptNumber(
      `Wallet — ${user.name}`,
      '+amount to credit · −amount to debit',
      'e.g. 50 or -20',
    )
    if (n === null) return
    try {
      await apiFetch('/admin/wallet/adjust', token, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, amount: Math.abs(n), type: n > 0 ? 'CREDIT' : 'DEBIT', note: 'Admin adjustment' }),
      })
      notify('success', `Wallet ${n > 0 ? 'credited' : 'debited'} ${Math.abs(n)} MRU`)
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="page">
      <Toast toast={toast} />

      {roleTarget && (
        <RoleModal
          user={roleTarget}
          token={token}
          notify={notify}
          onClose={() => setRoleTarget(null)}
          onSaved={() => void load()}
        />
      )}

      <PageHeader
        title="Users"
        count={users.length || undefined}
        sub="Manage user accounts, roles and wallet balances"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          onSearch={() => void load()}
          placeholder="Search name, phone…"
        />
        <Select value={role} options={ROLE_FILTERS} onChange={setRole} />
        <span className="toolbar-spacer" />
        {users.length > 0 && (
          <span className="toolbar-count">{users.length} users</span>
        )}
      </div>

      <Panel title="User Accounts" noPad>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Status</th>
                <th>Wallet</th><th>Points</th><th>Orders</th><th>Language</th>
                <th>Referral</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.phone}</td>
                  <td><span className="text-xs text-gray-500">{u.email ?? '—'}</span></td>
                  <td>
                    {u.role === 'SUPERADMIN' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck size={10} /> Super Admin
                      </span>
                    ) : u.role === 'ADMIN' ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"
                        title={`Permissions: ${(u.adminPermissions ?? []).join(', ') || 'none'}`}
                      >
                        <ShieldCheck size={10} /> Admin
                        {u.adminPermissions !== undefined && (
                          <span className="text-[10px] text-blue-400 font-medium">
                            {u.adminPermissions.length}/{ALL_PERMISSIONS.length}
                          </span>
                        )}
                      </span>
                    ) : (
                      <Badge label={u.role} />
                    )}
                  </td>
                  <td><BoolBadge value={u.isActive} falseLabel="Blocked" /></td>
                  <td><strong>{money(u.walletBalance)}</strong></td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {u.loyaltyPoints} pts
                    </span>
                  </td>
                  <td><strong>{u._count?.orders ?? '—'}</strong></td>
                  <td><span className="text-xs text-gray-500 uppercase">{u.language}</span></td>
                  <td>
                    {u.referralCode
                      ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{u.referralCode}</span>
                      : '—'}
                  </td>
                  <td><span className="text-xs text-gray-400">{fmtDate(u.createdAt)}</span></td>
                  <td>
                    <RowActions actions={[
                      { label: 'Adjust Wallet', onClick: () => void adjustWallet(u) },
                      ...(viewerRole === 'SUPERADMIN' && (u.role === 'ADMIN' || u.role === 'SUPERADMIN') ? [
                        { label: 'Permissions', onClick: () => navigate(`/users/${u.id}/permissions`), disabled: u.role === 'SUPERADMIN' },
                        { label: 'Change Role', onClick: () => setRoleTarget(u) },
                        { separator: true, label: '', onClick: () => {} },
                      ] : []),
                      { label: u.isActive ? 'Block user' : 'Unblock user', danger: u.isActive, onClick: () => void patch(u.id, { isActive: !u.isActive }, 'User updated', u) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && <EmptyState label="No users found" />}
        </div>
      </Panel>
    </div>
  )
}
