import { useCallback, useEffect, useState } from 'react'
import { Send, RefreshCw, Megaphone } from 'lucide-react'
import { confirmDelete } from '../utils/swal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { fmtDateTime } from '../utils/format'
import { NOTIFICATION_TYPES, ROLE_FILTERS } from '../constants'
import type { Notification } from '../types'

const TARGETS = ['ALL', 'ROLE', 'USER'] as const

type Draft = { title: string; body: string; type: string; target: string; phone: string; role: string }
const BLANK: Draft = { title: '', body: '', type: 'INFO', target: 'ALL', phone: '', role: 'CUSTOMER' }

export default function NotificationsPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [draft,   setDraft]   = useState<Draft>(BLANK)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { notifications } = await apiFetch<{ notifications: Notification[] }>('/admin/notifications', token)
      setNotifications(notifications)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => { void load() }, [load])

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title || !draft.body) return notify('error', 'Title and body required')
    if (draft.target === 'USER' && !draft.phone.trim()) return notify('error', 'Phone number required')
    const payload: Record<string, unknown> = { title: draft.title, body: draft.body, type: draft.type }
    if (draft.target === 'ALL')  payload['all']    = true
    if (draft.target === 'ROLE') payload['role']   = draft.role
    if (draft.target === 'USER') payload['phone'] = draft.phone
    try {
      await apiFetch('/admin/notifications', token, { method: 'POST', body: JSON.stringify(payload) })
      notify('success', 'Notification sent')
      setDraft(BLANK)
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const del = async (id: string, title: string) => {
    if (!await confirmDelete(`Delete notification "${title}"?`)) return
    try {
      await apiFetch(`/admin/notifications/${id}`, token, { method: 'DELETE' })
      notify('success', 'Notification deleted')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const roleOpts = ROLE_FILTERS.filter((r) => r !== 'ALL')

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Notifications"
        count={notifications.length || undefined}
        sub="Broadcast messages and targeted push notifications"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="grid-two">
        {/* Compose Panel */}
        <Panel title="Compose Notification">
          <form className="form-stack" onSubmit={(e) => void send(e)}>
            <Field label="Title">
              <input value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Notification title…" />
            </Field>
            <Field label="Message body">
              <textarea
                value={draft.body}
                onChange={(e) => set({ body: e.target.value })}
                rows={3}
                placeholder="Write your message…"
                className="resize-none"
              />
            </Field>

            <div className="h-px bg-gray-100" />

            <div className="form-row">
              <Field label="Type">
                <Select value={draft.type} options={NOTIFICATION_TYPES} onChange={(v) => set({ type: v })} />
              </Field>
              <Field label="Target audience">
                <Select value={draft.target} options={TARGETS} onChange={(v) => set({ target: v })} />
              </Field>
            </div>

            {draft.target === 'ROLE' && (
              <Field label="Role">
                <Select value={draft.role} options={roleOpts} onChange={(v) => set({ role: v })} />
              </Field>
            )}
            {draft.target === 'USER' && (
              <Field label="Phone number" hint="Enter the user's phone number (e.g. 22012345678)">
                <input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="22012345678" inputMode="tel" />
              </Field>
            )}

            {/* Preview */}
            {(draft.title || draft.body) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Megaphone size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{draft.title || 'Notification title'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{draft.body || 'Message body…'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge label={draft.type} />
                      <span className="text-xs text-gray-400">→ {draft.target === 'ALL' ? 'All users' : draft.target === 'ROLE' ? `Role: ${draft.role}` : `Phone: ${draft.phone || '?'}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-primary justify-center" type="submit">
              <Send size={14} /> Send Notification
            </button>
          </form>
        </Panel>

        {/* History Panel */}
        <Panel title={`Sent Notifications (${notifications.length})`} noPad>
          <ul className="notif-list">
            {notifications.map((n) => (
              <li key={n.id} className="notif-item">
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <small>
                    <Badge label={n.type} />
                    <span>{n.user ? `${n.user.name} (${n.user.phone})` : 'Broadcast'}</span>
                    <span>·</span>
                    <span>{fmtDateTime(n.createdAt)}</span>
                  </small>
                </div>
                <button className="btn-xs btn-danger shrink-0" onClick={() => void del(n.id, n.title)}>Delete</button>
              </li>
            ))}
            {notifications.length === 0 && !loading && <EmptyState label="No notifications sent yet" />}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
