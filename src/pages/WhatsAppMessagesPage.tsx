import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, List } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { fmtDateTime } from '../utils/format'
import type { WhatsAppMessage } from '../types'

const TYPE_FILTERS = ['ALL', 'MANUAL', 'OTP'] as const

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  MANUAL: { bg: '#eff6ff', color: '#1d4ed8' },
  OTP:    { bg: '#f5f3ff', color: '#6d28d9' },
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  SENT:   { bg: '#f0fdf4', color: '#15803d' },
  FAILED: { bg: '#fff1f2', color: '#b91c1c' },
}

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_COLORS[type] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {type}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  )
}

export default function WhatsAppMessagesPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [messages,   setMessages]   = useState<WhatsAppMessage[]>([])
  const [loading,    setLoading]    = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [recipient,  setRecipient]  = useState('')
  const [adminFilter, setAdminFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'ALL') params.set('type', typeFilter)
      if (recipient.trim()) params.set('recipient', recipient.trim())
      const { messages: msgs } = await apiFetch<{ messages: WhatsAppMessage[] }>(
        `/admin/whatsapp-messages?${params}`,
        token,
      )
      setMessages(msgs)
      setAdminFilter('ALL')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [token, notify, typeFilter, recipient])

  useEffect(() => { void load() }, [load])

  // Derive unique admins from loaded data for client-side admin filter
  const adminOptions = useMemo(() => {
    const seen = new Map<string, string>()
    seen.set('ALL', 'All Senders')
    seen.set('SYSTEM', 'System (OTP)')
    messages.forEach((m) => {
      if (m.admin) seen.set(m.admin.id, m.admin.name)
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [messages])

  const displayed = useMemo(() => {
    if (adminFilter === 'ALL') return messages
    if (adminFilter === 'SYSTEM') return messages.filter((m) => m.adminId === null)
    return messages.filter((m) => m.adminId === adminFilter)
  }, [messages, adminFilter])

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="WhatsApp Messages"
        count={displayed.length || undefined}
        sub="Log of all WhatsApp messages sent — OTPs and manual admin messages"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="toolbar">
        <Select value={typeFilter} options={TYPE_FILTERS} onChange={setTypeFilter} />
        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          className="select"
          style={{ minWidth: 160 }}
        >
          {adminOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Filter by phone…"
          className="input"
          style={{ minWidth: 180 }}
        />
        <span className="toolbar-spacer" />
        {displayed.length > 0 && (
          <span className="toolbar-count">{displayed.length} message{displayed.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <List size={15} className="text-violet-600" />
            Message Log
          </span>
        }
        noPad
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Type</th>
                <th>Status</th>
                <th>Content</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((msg) => (
                <tr key={msg.id}>
                  <td>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(msg.createdAt)}</span>
                  </td>
                  <td>
                    {msg.admin ? (
                      <>
                        <strong className="text-sm">{msg.admin.name}</strong>
                        <small className="block text-xs text-gray-400 uppercase">{msg.admin.role}</small>
                      </>
                    ) : (
                      <>
                        <strong className="text-sm">System</strong>
                        <small className="block text-xs text-gray-400">OTP bot</small>
                      </>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-sm">{msg.recipient}</span>
                  </td>
                  <td><TypeBadge type={msg.type} /></td>
                  <td>
                    <StatusBadge status={msg.status} />
                    {msg.error && (
                      <small className="block text-xs text-red-400 mt-0.5 max-w-[140px] truncate" title={msg.error}>
                        {msg.error}
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className="text-xs text-gray-600 max-w-[280px] block truncate whitespace-pre-wrap"
                      title={msg.content}
                      style={{ direction: 'rtl', textAlign: 'right' }}
                    >
                      {msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayed.length === 0 && !loading && <EmptyState label="No messages yet" />}
        </div>
      </Panel>
    </div>
  )
}
