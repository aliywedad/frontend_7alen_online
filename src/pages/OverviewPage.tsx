import { useCallback, useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingBag, UtensilsCrossed, Car, Users, Truck,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { StatCard } from '../components/ui/StatCard'
import { Panel } from '../components/ui/Panel'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { money, shortId, fmtDateTime } from '../utils/format'
import type { Stats, Order, DriverProfile, Notification, Analytics } from '../types'

type OverviewData = {
  stats: Stats | null
  orders: Order[]
  drivers: DriverProfile[]
  notifications: Notification[]
  analytics: Analytics | null
}

export default function OverviewPage() {
  const { token, hasPermission } = useAuth()
  const { toast, notify } = useToast()
  const [data,    setData]    = useState<OverviewData>({ stats: null, orders: [], drivers: [], notifications: [], analytics: null })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [stats, ordersRes, driversRes, notifsRes, analytics] = await Promise.all([
        apiFetch<Stats>('/admin/stats', token),
        hasPermission('orders')        ? apiFetch<{ orders: Order[] }>('/admin/orders?status=ALL', token)                 : Promise.resolve({ orders: [] }),
        hasPermission('drivers')       ? apiFetch<{ drivers: DriverProfile[] }>('/admin/drivers', token)                  : Promise.resolve({ drivers: [] }),
        hasPermission('notifications') ? apiFetch<{ notifications: Notification[] }>('/admin/notifications', token)       : Promise.resolve({ notifications: [] }),
        hasPermission('analytics')     ? apiFetch<Analytics>('/admin/analytics?days=30', token)                           : Promise.resolve(null),
      ])
      setData({
        stats,
        orders: ordersRes.orders.slice(0, 8),
        drivers: driversRes.drivers.filter((d) => d.isOnline).slice(0, 8),
        notifications: notifsRes.notifications.slice(0, 6),
        analytics,
      })
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, notify, hasPermission])

  useEffect(() => { void load() }, [load])

  const s = data.stats

  return (
    <div className="page w-full   px-4 py-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap ">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Platform Overview</h2>
          <p className="mt-0.5 text-sm text-gray-400 font-medium">Real-time stats — 7alan food delivery</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? <Spinner size={14} /> : <RefreshCw size={14} />}
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Revenue"  value={money(s?.revenue)}        sub="from delivered orders"         accent icon={<TrendingUp size={18} />} />
        <StatCard label="Orders"         value={s?.orders ?? 0}           sub={`${s?.pendingOrders ?? 0} pending`}     icon={<ShoppingBag size={18} />} />
        <StatCard label="Restaurants"    value={s?.restaurants ?? 0}      sub={`${s?.activeRestaurants ?? 0} active`}  icon={<UtensilsCrossed size={18} />} />
        <StatCard label="Drivers"        value={s?.drivers ?? 0}          sub={`${s?.onlineDrivers ?? 0} online`}      icon={<Car size={18} />} />
        <StatCard label="Users"          value={s?.users ?? 0}            sub={`${s?.customers ?? 0} customers`}      icon={<Users size={18} />} />
        <StatCard label="Courier"        value={s?.courierRequests ?? 0}  sub={`${s?.pendingCourierRequests ?? 0} pending`} icon={<Truck size={18} />} />
      </div>

      {/* Row 1 */}
      <div className="grid-two">
        <Panel title="Recent Orders" noPad>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Restaurant</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{shortId(o.id)}</strong><small>{fmtDateTime(o.createdAt)}</small></td>
                    <td>{o.customer.name}<small>{o.customer.phone}</small></td>
                    <td>{o.restaurant.name}</td>
                    <td><strong>{money(o.total)}</strong></td>
                    <td><Badge label={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.orders.length === 0 && <EmptyState label="No recent orders" />}
          </div>
        </Panel>

        <Panel title="Online Drivers" noPad>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Driver</th><th>Vehicle</th><th>Rating</th></tr>
              </thead>
              <tbody>
                {data.drivers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.user.name}<small>{d.user.phone}</small></td>
                    <td>{d.vehicleType} · {d.vehiclePlate}</td>
                    <td>
                      <span className="font-bold text-amber-600">{d.rating.toFixed(1)}</span>
                      <span className="text-amber-400 ml-0.5">★</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.drivers.length === 0 && <EmptyState label="No drivers online" />}
          </div>
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid-two mt-5">
        <Panel title="Top Restaurants — 30 days" noPad>
          <ul className="ranking-list">
            {(data.analytics?.topRestaurants ?? []).slice(0, 8).map((r, i) => (
              <li key={r.id} className="ranking-item">
                <span className="rank-num">#{i + 1}</span>
                <div>
                  <strong>{r.name}</strong>
                  <small>{r.totalOrders} orders · <span className="text-amber-500">{r.rating.toFixed(1)} ★</span></small>
                </div>
              </li>
            ))}
            {!data.analytics && <EmptyState />}
          </ul>
        </Panel>

        <Panel title="Recent Notifications" noPad>
          <ul className="notif-list">
            {data.notifications.map((n) => (
              <li key={n.id} className="notif-item">
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <small>
                    <Badge label={n.type} />
                    <span>{n.user ? n.user.name : 'Broadcast'}</span>
                  </small>
                </div>
              </li>
            ))}
            {data.notifications.length === 0 && <EmptyState label="No notifications" />}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
