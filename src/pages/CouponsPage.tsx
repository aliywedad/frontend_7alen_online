import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw, Tag } from 'lucide-react'
import { confirmDelete } from '../utils/swal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { Select } from '../components/ui/Select'
import { Badge, BoolBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { RowActions } from '../components/ui/RowActions'
import { money, fmtDate } from '../utils/format'
import { COUPON_TYPES, COUPON_SCOPES } from '../constants'
import type { Coupon } from '../types'

type Draft = Partial<Coupon>
const BLANK: Draft = { code: '', type: 'PERCENTAGE', value: 10, minOrder: 0, perUserLimit: 1, isActive: true, scope: 'ALL' }

export default function CouponsPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [draft,   setDraft]   = useState<Draft>(BLANK)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { coupons } = await apiFetch<{ coupons: Coupon[] }>('/admin/coupons', token)
      setCoupons(coupons)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => { void load() }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.code) return notify('error', 'Code required')
    const isEdit = Boolean(draft.id)
    try {
      await apiFetch(
        isEdit ? `/admin/coupons/${draft.id}` : '/admin/coupons',
        token,
        {
          method: isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify({
            code: draft.code, description: draft.description, type: draft.type,
            value: draft.value, minOrder: draft.minOrder, maxDiscount: draft.maxDiscount,
            perUserLimit: draft.perUserLimit, usageLimit: draft.usageLimit,
            isActive: draft.isActive, scope: draft.scope, storeType: draft.storeType,
            restaurantId: draft.restaurantId, startsAt: draft.startsAt, expiresAt: draft.expiresAt,
          }),
        },
      )
      notify('success', isEdit ? 'Coupon updated' : 'Coupon created')
      setDraft(BLANK)
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const del = async (id: string, code: string) => {
    if (!await confirmDelete(`Delete coupon "${code}"?`)) return
    try {
      await apiFetch(`/admin/coupons/${id}`, token, { method: 'DELETE' })
      notify('success', 'Coupon deleted')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const isEdit = Boolean(draft.id)

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Coupons"
        count={coupons.length || undefined}
        sub="Create discount codes and promotions"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="grid-two">
        {/* Form Panel */}
        <Panel title={isEdit ? 'Edit Coupon' : 'New Coupon'}>
          <form className="form-stack" onSubmit={(e) => void submit(e)}>

            {/* Code + description */}
            <Field label="Coupon Code">
              <input
                value={draft.code ?? ''}
                onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                className="font-mono uppercase tracking-widest"
              />
            </Field>
            <Field label="Description">
              <input value={draft.description ?? ''} onChange={(e) => set({ description: e.target.value })} placeholder="Optional description…" />
            </Field>

            <div className="h-px bg-gray-100" />

            {/* Type + value */}
            <div className="form-row">
              <Field label="Type">
                <Select value={draft.type ?? 'PERCENTAGE'} options={COUPON_TYPES} onChange={(v) => set({ type: v })} />
              </Field>
              <Field label="Value">
                <input type="number" value={draft.value ?? 0} onChange={(e) => set({ value: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Min Order (MRU)">
                <input type="number" value={draft.minOrder ?? 0} onChange={(e) => set({ minOrder: Number(e.target.value) })} />
              </Field>
              <Field label="Max Discount">
                <input type="number" value={draft.maxDiscount ?? ''} onChange={(e) => set({ maxDiscount: e.target.value ? Number(e.target.value) : null })} placeholder="optional" />
              </Field>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Usage limits */}
            <div className="form-row">
              <Field label="Per-user limit">
                <input type="number" value={draft.perUserLimit ?? 1} onChange={(e) => set({ perUserLimit: Number(e.target.value) })} />
              </Field>
              <Field label="Total limit">
                <input type="number" value={draft.usageLimit ?? ''} onChange={(e) => set({ usageLimit: e.target.value ? Number(e.target.value) : null })} placeholder="optional" />
              </Field>
            </div>

            {/* Scope */}
            <div className="form-row">
              <Field label="Scope">
                <Select value={draft.scope ?? 'ALL'} options={COUPON_SCOPES} onChange={(v) => set({ scope: v })} />
              </Field>
              <Field label="Store Type">
                <input value={draft.storeType ?? ''} onChange={(e) => set({ storeType: e.target.value || null })} placeholder="FOOD / GROCERY / PHARMACY" />
              </Field>
            </div>
            <Field label="Restaurant ID" hint="Only for RESTAURANT scope">
              <input value={draft.restaurantId ?? ''} onChange={(e) => set({ restaurantId: e.target.value || null })} />
            </Field>

            <div className="h-px bg-gray-100" />

            {/* Dates */}
            <div className="form-row">
              <Field label="Starts at">
                <input type="datetime-local" value={draft.startsAt ? draft.startsAt.slice(0, 16) : ''} onChange={(e) => set({ startsAt: e.target.value || null })} />
              </Field>
              <Field label="Expires at">
                <input type="datetime-local" value={draft.expiresAt ? draft.expiresAt.slice(0, 16) : ''} onChange={(e) => set({ expiresAt: e.target.value || null })} />
              </Field>
            </div>

            <label className="checkbox-label">
              <input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => set({ isActive: e.target.checked })} />
              Active
            </label>

            <div className="flex gap-3">
              <button className="btn-primary flex-1 justify-center" type="submit">
                {isEdit ? 'Save Changes' : <><Plus size={15} /> Create Coupon</>}
              </button>
              {isEdit && (
                <button type="button" className="btn-secondary" onClick={() => setDraft(BLANK)}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Panel>

        {/* Coupons List */}
        <Panel title={`Coupons (${coupons.length})`} noPad>
          <div className="cards-list">
            {coupons.map((c) => (
              <div className="entity-card" key={c.id}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={13} className="text-amber-500" />
                    <strong>{c.code}</strong>
                  </div>
                  <p>{c.description ?? c.type}</p>
                  <small>
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : c.type === 'FIXED' ? `${money(c.value)} off` : 'Free delivery'}
                    {' · '} min {money(c.minOrder)}
                    {' · '} used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                  </small>
                  <small>{c.scope}{c.storeType ? ` · ${c.storeType}` : ''} · {fmtDate(c.createdAt)}</small>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div className="card-meta">
                    <BoolBadge value={c.isActive} />
                    {c.expiresAt && <Badge label={`Until ${fmtDate(c.expiresAt)}`} variant="badge-neutral" />}
                  </div>
                  <RowActions actions={[
                    { label: 'Edit', onClick: () => setDraft(c) },
                    { label: 'Delete', danger: true, onClick: () => void del(c.id, c.code ?? '') },
                  ]} />
                </div>
              </div>
            ))}
            {coupons.length === 0 && !loading && <EmptyState label="No coupons yet" />}
          </div>
        </Panel>
      </div>
    </div>
  )
}
