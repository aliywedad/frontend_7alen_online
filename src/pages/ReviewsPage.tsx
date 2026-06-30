import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { fmtDateTime } from '../utils/format'
import type { Review } from '../types'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
      <span className="ml-1 text-xs font-bold text-gray-500">({rating})</span>
    </span>
  )
}

export default function ReviewsPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [reviews,  setReviews]  = useState<Review[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { reviews } = await apiFetch<{ reviews: Review[] }>('/admin/reviews', token)
      setReviews(reviews)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => { void load() }, [load])

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Reviews"
        count={reviews.length || undefined}
        sub={avgRating ? `Average rating: ${avgRating} ★` : 'Customer feedback and ratings'}
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <Panel title="Customer Reviews" noPad>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th><th>Restaurant</th><th>Driver</th>
                <th>Rating</th><th>Driver Rating</th><th>Comment</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{r.user?.name ?? 'Anonymous'}<small>{r.user?.phone}</small></td>
                  <td>{r.restaurant?.name ?? '—'}</td>
                  <td>{r.driver?.user.name ?? '—'}</td>
                  <td><Stars rating={r.rating} /></td>
                  <td>{r.driverRating != null ? <Stars rating={r.driverRating} /> : <span className="text-gray-300">—</span>}</td>
                  <td className="max-w-[240px] whitespace-normal">
                    <span className="text-xs text-gray-600 leading-relaxed">{r.comment ?? '—'}</span>
                  </td>
                  <td><span className="text-xs text-gray-400">{fmtDateTime(r.createdAt)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviews.length === 0 && !loading && <EmptyState label="No reviews yet" />}
        </div>
      </Panel>
    </div>
  )
}
