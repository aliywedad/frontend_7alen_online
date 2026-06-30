import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { money, shortId, fmtDateTime } from '../utils/format'
import { ORDER_STATUSES } from '../constants'
import type { Order } from '../types'

const STATUS_OPTS = ['ALL', ...ORDER_STATUSES] as const

export default function OrdersPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('ALL')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search)}` : ''
      const { orders } = await apiFetch<{ orders: Order[] }>(`/admin/orders?status=${status}${q}`, token)
      setOrders(orders)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify, status, search])

  useEffect(() => { void load() }, [load])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/orders/${id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      notify('success', 'Order status updated')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Orders"
        count={orders.length || undefined}
        sub="Manage and update order statuses"
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
          placeholder="Search customer, restaurant…"
        />
        <Select value={status} options={STATUS_OPTS} onChange={setStatus} />
        <span className="toolbar-spacer" />
        {orders.length > 0 && (
          <span className="toolbar-count">{orders.length} results</span>
        )}
      </div>

      <Panel title="All Orders" noPad>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Restaurant</th><th>Driver</th>
                <th>Subtotal</th><th>Fee</th><th>Discount</th><th>Tip</th><th>Total</th>
                <th>Payment</th><th>Coupon</th><th>Status</th><th>Date</th><th>Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{shortId(o.id)}</strong></td>
                  <td>{o.customer.name}<small>{o.customer.phone}</small></td>
                  <td>{o.restaurant.name}</td>
                  <td>{o.driver?.user.name ?? <span className="text-gray-400 italic text-xs">Unassigned</span>}</td>
                  <td>{money(o.subtotal)}</td>
                  <td>{money(o.deliveryFee)}</td>
                  <td>{o.discount ? money(o.discount) : '—'}</td>
                  <td>{o.tip ? money(o.tip) : '—'}</td>
                  <td><strong className="text-gray-900">{money(o.total)}</strong></td>
                  <td><span className="text-xs font-semibold text-gray-500">{o.paymentMethod}</span></td>
                  <td>{o.couponCode ?? '—'}</td>
                  <td><Badge label={o.status} /></td>
                  <td><span className="text-xs text-gray-400">{fmtDateTime(o.createdAt)}</span></td>
                  <td>
                    <Select
                      value={o.status}
                      options={ORDER_STATUSES}
                      onChange={(s) => void updateStatus(o.id, s)}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !loading && <EmptyState label="No orders found" />}
        </div>
      </Panel>
    </div>
  )
}
