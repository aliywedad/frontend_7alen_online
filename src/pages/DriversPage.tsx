import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Circle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { BoolBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { RowActions } from '../components/ui/RowActions'
import { money } from '../utils/format'
import type { DriverProfile } from '../types'

export default function DriversPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [drivers,  setDrivers]  = useState<DriverProfile[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { drivers } = await apiFetch<{ drivers: DriverProfile[] }>('/admin/drivers', token)
      setDrivers(drivers)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => { void load() }, [load])

  const toggle = async (d: DriverProfile) => {
    try {
      await apiFetch(`/admin/drivers/${d.id}`, token, { method: 'PATCH', body: JSON.stringify({ isOnline: !d.isOnline }) })
      notify('success', 'Driver status updated')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const onlineCount = drivers.filter((d) => d.isOnline).length

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Drivers"
        sub="Monitor and manage the driver fleet"
        actions={
          <>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <Circle size={8} className="fill-emerald-500 text-emerald-500" />
              {onlineCount} online
            </div>
            <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
              {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </>
        }
      />

      {drivers.length > 0 && (
        <div className="toolbar">
          <span className="toolbar-count">{drivers.length} drivers total</span>
          <span className="toolbar-count">{onlineCount} online</span>
          <span className="toolbar-count">{drivers.length - onlineCount} offline</span>
        </div>
      )}

      <Panel title="Driver Fleet" noPad>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver</th><th>Vehicle Type</th><th>Plate</th><th>Status</th>
                <th>Rating</th><th>Deliveries</th><th>Earnings</th><th>Tips</th>
                <th>Location</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.user.name}</strong>
                    <small>{d.user.phone}</small>
                    {!d.user.isActive && (
                      <small className="text-red-500 font-semibold">Blocked</small>
                    )}
                  </td>
                  <td><span className="text-xs font-semibold text-gray-500">{d.vehicleType}</span></td>
                  <td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-md">{d.vehiclePlate}</span></td>
                  <td><BoolBadge value={d.isOnline} trueLabel="Online" falseLabel="Offline" /></td>
                  <td>
                    <span className="font-bold text-amber-600">{d.rating.toFixed(1)}</span>
                    <span className="text-amber-400 ml-0.5">★</span>
                  </td>
                  <td><strong>{d.totalDeliveries}</strong></td>
                  <td><strong>{money(d.earnings)}</strong></td>
                  <td>{money(d.totalTips)}</td>
                  <td>
                    {d.currentLat != null
                      ? <span className="text-xs font-mono text-gray-500">{d.currentLat.toFixed(4)}, {d.currentLng?.toFixed(4)}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td>
                    <RowActions actions={[
                      { label: d.isOnline ? 'Set Offline' : 'Set Online', danger: d.isOnline, onClick: () => void toggle(d) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {drivers.length === 0 && !loading && <EmptyState label="No drivers registered" />}
        </div>
      </Panel>
    </div>
  )
}
