import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { money, shortId, fmtDateTime } from '../utils/format'
import { COURIER_STATUSES } from '../constants'
import type { CourierRequest } from '../types'

const STATUS_OPTS = ['ALL', ...COURIER_STATUSES] as const

export default function CourierPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [requests, setRequests] = useState<CourierRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { requests } = await apiFetch<{ requests: CourierRequest[] }>(`/admin/courier?status=${status}`, token)
      setRequests(requests)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify, status])

  useEffect(() => { void load() }, [load])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/courier/${id}`, token, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      notify('success', 'Updated')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Courier Requests"
        count={requests.length || undefined}
        sub="P2P package delivery management"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="toolbar">
        <Select value={status} options={STATUS_OPTS} onChange={setStatus} />
        <span className="toolbar-spacer" />
        {requests.length > 0 && (
          <span className="toolbar-count">{requests.length} requests</span>
        )}
      </div>

      <Panel title="Courier Requests" noPad>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Pickup</th><th>Drop</th>
                <th>Size</th><th>Fee</th><th>Distance</th><th>ETA</th>
                <th>Driver</th><th>Status</th><th>Notes</th><th>Date</th><th>Update</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td><strong>{shortId(r.id)}</strong></td>
                  <td>{r.customer.name}<small>{r.customer.phone}</small></td>
                  <td className="max-w-[160px] overflow-hidden text-ellipsis text-xs">{r.pickupAddress}</td>
                  <td className="max-w-[160px] overflow-hidden text-ellipsis text-xs">{r.dropAddress}</td>
                  <td><Badge label={r.packageSize} /></td>
                  <td><strong>{money(r.fee)}</strong></td>
                  <td>{r.distance != null ? <><strong>{r.distance.toFixed(1)}</strong><small>km</small></> : '—'}</td>
                  <td>{r.estimatedTime != null ? <><strong>{r.estimatedTime}</strong><small>min</small></> : '—'}</td>
                  <td>{r.driver?.user.name ?? <span className="text-gray-300 italic text-xs">Unassigned</span>}</td>
                  <td><Badge label={r.status} /></td>
                  <td><span className="text-xs text-gray-400">{r.notes ?? '—'}</span></td>
                  <td><span className="text-xs text-gray-400">{fmtDateTime(r.createdAt)}</span></td>
                  <td>
                    <Select
                      value={r.status}
                      options={COURIER_STATUSES}
                      onChange={(s) => void updateStatus(r.id, s)}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && !loading && <EmptyState label="No courier requests found" />}
        </div>
      </Panel>
    </div>
  )
}
