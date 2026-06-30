import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ClipboardList } from 'lucide-react'
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
import type { AuditLog } from '../types'

const ACTION_FILTERS = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'ADJUST'] as const
const PAGE_FILTERS   = ['ALL', 'users', 'restaurants', 'drivers', 'orders', 'courier', 'coupons', 'banners', 'notifications', 'settings'] as const

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: '#f0fdf4', color: '#15803d' },
  UPDATE: { bg: '#eff6ff', color: '#1d4ed8' },
  DELETE: { bg: '#fff1f2', color: '#b91c1c' },
  ADJUST: { bg: '#fffbeb', color: '#b45309' },
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_COLORS[action] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {action}
    </span>
  )
}

function formatDetails(details: string | null | undefined): string {
  if (!details) return '—'
  try {
    const obj = JSON.parse(details) as Record<string, unknown>
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(' · ')
  } catch {
    return details
  }
}

export default function AuditLogPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [logs,      setLogs]      = useState<AuditLog[]>([])
  const [loading,   setLoading]   = useState(true)
  const [action,    setAction]    = useState('ALL')
  const [page,      setPage]      = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (action !== 'ALL') params.set('action', action)
      if (page   !== 'ALL') params.set('page',   page)
      const { logs } = await apiFetch<{ logs: AuditLog[] }>(`/admin/audit?${params}`, token)
      setLogs(logs)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify, action, page])

  useEffect(() => { void load() }, [load])

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Audit Log"
        count={logs.length || undefined}
        sub="Track all create, update and delete actions by admins"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="toolbar">
        <Select value={action} options={ACTION_FILTERS} onChange={setAction} />
        <Select value={page}   options={PAGE_FILTERS}   onChange={setPage} />
        <span className="toolbar-spacer" />
        {logs.length > 0 && <span className="toolbar-count">{logs.length} entries</span>}
      </div>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <ClipboardList size={15} className="text-amber-600" />
            Action History
          </span>
        }
        noPad
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Section</th>
                <th>Resource</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(log.createdAt)}</span>
                  </td>
                  <td>
                    <strong className="text-sm">{log.admin?.name ?? log.adminId}</strong>
                    {log.admin && (
                      <small className="block text-xs text-gray-400 uppercase">{log.admin.role}</small>
                    )}
                  </td>
                  <td><ActionBadge action={log.action} /></td>
                  <td>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                      {log.page}
                    </span>
                  </td>
                  <td>
                    {log.resourceName
                      ? <strong className="text-sm">{log.resourceName}</strong>
                      : log.resourceId
                        ? <span className="font-mono text-xs text-gray-400">{log.resourceId.slice(0, 12)}…</span>
                        : <span className="text-gray-300">—</span>}
                  </td>
                  <td>
                    <span className="text-xs text-gray-500 max-w-[260px] block truncate" title={log.details ?? ''}>
                      {formatDetails(log.details)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !loading && <EmptyState label="No actions recorded yet" />}
        </div>
      </Panel>
    </div>
  )
}
