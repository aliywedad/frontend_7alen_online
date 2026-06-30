import { useCallback, useEffect, useState } from 'react'
import { BarChart3, RefreshCw, TrendingUp, DollarSign, Truck, Tag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { StatCard } from '../components/ui/StatCard'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { money } from '../utils/format'
import type { Analytics } from '../types'

const DAY_OPTS = ['7', '14', '30', '60', '90'] as const

export default function AnalyticsPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [data,    setData]    = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days,    setDays]    = useState('30')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const analytics = await apiFetch<Analytics>(`/admin/analytics?days=${days}`, token)
      setData(analytics)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify, days])

  useEffect(() => { void load() }, [load])

  const maxRev = Math.max(1, ...(data?.byDay ?? []).map((d) => d.revenue))

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Analytics"
        sub={`Platform performance — last ${days} days`}
        actions={
          <>
            <Select value={days} options={DAY_OPTS} onChange={setDays} />
            <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
              {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard label="Delivered Orders" value={data?.summary.deliveredOrders ?? 0}     sub={`last ${days} days`}   accent icon={<BarChart3 size={18} />} />
        <StatCard label="Revenue"          value={money(data?.summary.revenue)}            sub="total"                  icon={<TrendingUp size={18} />} />
        <StatCard label="Delivery Fees"    value={money(data?.summary.deliveryFees)}       sub="platform income"        icon={<DollarSign size={18} />} />
        <StatCard label="Tips"             value={money(data?.summary.tips)}               sub="paid to drivers"        icon={<Truck size={18} />} />
        <StatCard label="Discounts"        value={money(data?.summary.discounts)}          sub="coupon savings"         icon={<Tag size={18} />} />
        <StatCard label="Avg / Day"        value={money((data?.summary.revenue ?? 0) / Math.max(1, Number(days)))} sub="daily revenue" />
      </div>

      {/* Revenue chart */}
      <Panel
        title={`Daily Revenue — ${days} days`}
        tools={
          loading ? <Spinner size={14} /> : null
        }
        className="mb-5"
      >
        {data?.byDay.length ? (
          <div className="bar-chart">
            {data.byDay.map((d) => (
              <div
                className="bar"
                key={d.date}
                title={`${d.date}  ·  ${money(d.revenue)}  ·  ${d.orders} orders`}
              >
                <span style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
                <small>{d.date.slice(5)}</small>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No revenue data" />
        )}
      </Panel>

      <div className="grid-two">
        {/* Status breakdown */}
        <Panel title="Order Status Breakdown" noPad>
          <ul className="ranking-list">
            {(data?.statusBreakdown ?? []).map((s) => (
              <li key={s.status} className="ranking-item">
                <div className="flex items-center justify-center min-w-[44px] h-9 rounded-xl bg-amber-50 text-amber-700 font-extrabold text-sm shrink-0">
                  {s.count}
                </div>
                <strong>{s.status.replace(/_/g, ' ')}</strong>
                {data && (
                  <div className="ml-auto w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${(s.count / Math.max(1, data.statusBreakdown.reduce((a, b) => a + b.count, 0))) * 100}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
            {data?.statusBreakdown.length === 0 && <EmptyState />}
          </ul>
        </Panel>

        {/* Top drivers */}
        <Panel title="Top Performing Drivers" noPad>
          <ul className="ranking-list">
            {(data?.topDrivers ?? []).map((d, i) => (
              <li key={d.id} className="ranking-item">
                <span className="rank-num">#{i + 1}</span>
                <div>
                  <strong>{d.user.name}</strong>
                  <small>{d.vehicleType} · {d.vehiclePlate}</small>
                  <small>
                    {d.totalDeliveries} deliveries · {money(d.earnings)} ·{' '}
                    <span className="text-amber-500">{d.rating.toFixed(1)} ★</span>
                  </small>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-xs font-bold text-emerald-600">{money(d.earnings)}</span>
                  <span className="text-xs text-gray-400">{d.totalDeliveries} trips</span>
                </div>
              </li>
            ))}
            {data?.topDrivers.length === 0 && <EmptyState />}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
