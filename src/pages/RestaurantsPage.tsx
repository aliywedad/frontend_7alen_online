import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Plus, X, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { confirmAction } from '../utils/swal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Badge, BoolBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { RowActions } from '../components/ui/RowActions'
import { money, fmtDate } from '../utils/format'
import { STORE_TYPES } from '../constants'
import type { Restaurant } from '../types'

// ── Shared input class ─────────────────────────────────────────────────────────
const inp = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all w-full bg-white'

// ── Logo avatar (table + modal preview) ───────────────────────────────────────
function LogoAvatar({ src, name, size = 36 }: { src?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false)
  if (src && !err) {
    return (
      <img
        src={src} alt={name}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover flex-shrink-0 border border-gray-100"
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Logo picker (reusable inside modal) ────────────────────────────────────────
function LogoPicker({
  preview, pending, onPick, onClear,
}: {
  preview: string
  pending: boolean
  onPick: (file: File) => void
  onClear: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-start gap-4">
      <div
        style={{ width: 96, height: 96 }}
        className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-primary transition-colors flex items-center justify-center flex-shrink-0 relative"
        onClick={() => ref.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt="logo" className="w-full h-full object-cover" />
            {pending && (
              <span className="absolute bottom-1 left-1 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-tight">
                Pending
              </span>
            )}
            <button
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
              onClick={e => { e.stopPropagation(); onClear() }}
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload size={22} />
            <span className="text-[10px] text-center leading-tight">Upload<br />logo</span>
          </div>
        )}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-xs text-gray-400 leading-relaxed">
          Square image recommended (256×256 px or larger). PNG or JPG.
          <br />Click the box to pick a file — it will be uploaded on save.
        </p>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f) }} />
    </div>
  )
}

// ── Restaurant form modal ──────────────────────────────────────────────────────
type RForm = {
  name: string; nameAr: string; description: string
  category: string; storeType: string
  address: string; phone: string
  deliveryFee: string; minOrder: string; deliveryTime: string
  ownerName: string; ownerPhone: string; ownerPassword: string
  logo: string   // existing URL (empty = none)
}

const EMPTY: RForm = {
  name: '', nameAr: '', description: '', category: '', storeType: 'FOOD',
  address: '', phone: '', deliveryFee: '50', minOrder: '200', deliveryTime: '30',
  ownerName: '', ownerPhone: '', ownerPassword: '', logo: '',
}

function fromRestaurant(r: Restaurant): RForm {
  return {
    name: r.name, nameAr: r.nameAr ?? '', description: r.description ?? '',
    category: r.category, storeType: r.storeType,
    address: r.address, phone: r.phone,
    deliveryFee: String(r.deliveryFee), minOrder: String(r.minOrder), deliveryTime: String(r.deliveryTime),
    ownerName: '', ownerPhone: '', ownerPassword: '',
    logo: r.logo ?? '',
  }
}

function RestaurantModal({
  target, token, onClose, onSaved, notify,
}: {
  target: Restaurant | 'new'
  token: string
  onClose: () => void
  onSaved: () => void
  notify: (type: 'success' | 'error', msg: string) => void
}) {
  const isEdit = target !== 'new'
  const [form, setForm]           = useState<RForm>(() => isEdit ? fromRestaurant(target as Restaurant) : { ...EMPTY })
  const [pendingLogo, setPending] = useState<File | null>(null)
  const [logoPreview, setPreview] = useState<string>(() => isEdit ? ((target as Restaurant).logo ?? '') : '')
  const [saving, setSaving]       = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = (k: keyof RForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  const pickLogo = (file: File) => {
    setPending(file)
    setPreview(URL.createObjectURL(file))
  }
  const clearLogo = () => {
    setPending(null)
    setPreview('')
    set('logo', '')
  }

  const submit = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.address.trim() || !form.phone.trim()) {
      notify('error', 'Name, category, address and phone are required'); return
    }
    if (!isEdit && (!form.ownerName.trim() || !form.ownerPhone.trim() || !form.ownerPassword.trim())) {
      notify('error', 'Owner name, phone and password are required'); return
    }
    setSaving(true)
    try {
      // Upload logo first if a new file was picked
      let logoUrl = form.logo
      if (pendingLogo) {
        const fd = new FormData()
        fd.append('file', pendingLogo)
        const { url } = await apiFetch<{ url: string }>('/upload', token, { method: 'POST', body: fd })
        logoUrl = url
      }

      if (isEdit) {
        const r = target as Restaurant
        await apiFetch(`/admin/restaurants/${r.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name, nameAr: form.nameAr || null, description: form.description || null,
            category: form.category, storeType: form.storeType,
            address: form.address, phone: form.phone,
            deliveryFee: Number(form.deliveryFee), minOrder: Number(form.minOrder),
            deliveryTime: Number(form.deliveryTime),
            logo: logoUrl || null,
          }),
        })
        notify('success', 'Restaurant updated')
      } else {
        await apiFetch('/admin/restaurants', token, {
          method: 'POST',
          body: JSON.stringify({
            name: form.name, nameAr: form.nameAr || null, description: form.description || null,
            category: form.category, storeType: form.storeType,
            address: form.address, phone: form.phone,
            deliveryFee: Number(form.deliveryFee), minOrder: Number(form.minOrder),
            deliveryTime: Number(form.deliveryTime),
            logo: logoUrl || null,
            ownerName: form.ownerName, ownerPhone: form.ownerPhone, ownerPassword: form.ownerPassword,
          }),
        })
        notify('success', 'Restaurant created')
      }
      onSaved()
      onClose()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? `Edit — ${(target as Restaurant).name}` : 'Add Restaurant'}
          </h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Logo */}
          <p className="modal-section">Logo</p>
          <LogoPicker
            preview={logoPreview}
            pending={!!pendingLogo}
            onPick={pickLogo}
            onClear={clearLogo}
          />

          {/* Restaurant details */}
          <p className="modal-section">Restaurant Details</p>
          <div className="form-grid-2">
            <label className="field">
              <span>Name *</span>
              <input ref={firstRef} className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Restaurant name" />
            </label>
            <label className="field">
              <span>Arabic Name</span>
              <input className={inp} value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="اسم المطعم (اختياري)" dir="rtl" />
            </label>
            <label className="field">
              <span>Category *</span>
              <input className={inp} value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Fast Food, Pizza…" />
            </label>
            <label className="field">
              <span>Store Type *</span>
              <Select value={form.storeType} options={STORE_TYPES} onChange={v => set('storeType', v)} className="w-full" />
            </label>
            <label className="field col-span-2">
              <span>Address *</span>
              <input className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
            </label>
            <label className="field">
              <span>Phone *</span>
              <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Restaurant phone number" />
            </label>
            <label className="field">
              <span>Description</span>
              <input className={inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description (optional)" />
            </label>
          </div>

          {/* Delivery settings */}
          <p className="modal-section">Delivery Settings</p>
          <div className="form-grid-3">
            <label className="field">
              <span>Delivery Fee (MRU)</span>
              <input type="number" className={inp} value={form.deliveryFee} onChange={e => set('deliveryFee', e.target.value)} min="0" />
            </label>
            <label className="field">
              <span>Min Order (MRU)</span>
              <input type="number" className={inp} value={form.minOrder} onChange={e => set('minOrder', e.target.value)} min="0" />
            </label>
            <label className="field">
              <span>Delivery Time (min)</span>
              <input type="number" className={inp} value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)} min="1" />
            </label>
          </div>

          {/* Owner account — create only */}
          {!isEdit && (
            <>
              <p className="modal-section">Owner Account</p>
              <div className="form-grid-2">
                <label className="field">
                  <span>Owner Name *</span>
                  <input className={inp} value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="Full name" />
                </label>
                <label className="field">
                  <span>Owner Phone *</span>
                  <input className={inp} value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} placeholder="Phone number" />
                </label>
                <label className="field">
                  <span>Password *</span>
                  <input type="password" className={inp} value={form.ownerPassword} onChange={e => set('ownerPassword', e.target.value)} placeholder="Min 6 characters" />
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={() => void submit()} disabled={saving} style={{ gap: 6 }}>
            {saving && <Spinner size={13} />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Restaurant'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RestaurantsPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState<Restaurant | 'new' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = search.trim() ? `&search=${encodeURIComponent(search)}` : ''
      const { restaurants } = await apiFetch<{ restaurants: Restaurant[] }>(`/admin/restaurants?status=all${q}`, token)
      setRestaurants(restaurants)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify, search])

  useEffect(() => { void load() }, [load])

  const patch = async (id: string, body: Record<string, unknown>, name: string) => {
    if ('isActive' in body && !body['isActive']) {
      if (!await confirmAction(`Deactivate "${name}"?`, 'The restaurant will be hidden from customers.', 'Deactivate')) return
    }
    try {
      await apiFetch(`/admin/restaurants/${id}`, token, { method: 'PATCH', body: JSON.stringify(body) })
      notify('success', 'Restaurant updated')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="page">
      <Toast toast={toast} />

      {modal !== null && (
        <RestaurantModal
          target={modal}
          token={token}
          onClose={() => setModal(null)}
          onSaved={() => void load()}
          notify={notify}
        />
      )}

      <PageHeader
        title="Restaurants"
        count={restaurants.length || undefined}
        sub="Manage restaurant listings and availability"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={() => setModal('new')}>
              <Plus size={14} /> Add Restaurant
            </button>
            <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
              {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        }
      />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          onSearch={() => void load()}
          placeholder="Search name, address…"
        />
        <span className="toolbar-spacer" />
        {restaurants.length > 0 && (
          <span className="toolbar-count">{restaurants.length} restaurants</span>
        )}
      </div>

      <Panel title="Restaurant Directory" noPad>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Restaurant</th><th>Category</th><th>Type</th><th>Address</th><th>Phone</th>
                <th>Owner</th><th>Fee</th><th>Min Order</th><th>ETA</th>
                <th>Rating</th><th>Orders</th><th>Open</th><th>Active</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <LogoAvatar src={r.logo} name={r.name} size={36} />
                      <div>
                        <button
                          className="text-left hover:text-primary transition-colors"
                          onClick={() => navigate(`/restaurants/${r.id}/menu`)}
                        >
                          <strong className="hover:underline cursor-pointer">{r.name}</strong>
                        </button>
                        {r.nameAr && <small className="block">{r.nameAr}</small>}
                      </div>
                    </div>
                  </td>
                  <td><span className="text-xs font-semibold text-gray-500">{r.category}</span></td>
                  <td><Badge label={r.storeType} /></td>
                  <td className="max-w-[180px] overflow-hidden text-ellipsis">{r.address}</td>
                  <td>{r.phone}</td>
                  <td>{r.owner.name}<small>{r.owner.phone}</small></td>
                  <td>{money(r.deliveryFee)}</td>
                  <td>{money(r.minOrder)}</td>
                  <td><span className="font-semibold">{r.deliveryTime}</span><small>min</small></td>
                  <td>
                    <span className="font-bold text-amber-600">{r.rating.toFixed(1)}</span>
                    <span className="text-amber-400 ml-0.5">★</span>
                  </td>
                  <td><strong>{r.totalOrders}</strong></td>
                  <td><BoolBadge value={r.isOpen} trueLabel="Open" falseLabel="Closed" /></td>
                  <td><BoolBadge value={r.isActive} /></td>
                  <td><span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span></td>
                  <td>
                    <RowActions actions={[
                      { label: 'View Menu',  onClick: () => navigate(`/restaurants/${r.id}/menu`) },
                      { label: 'Edit',       onClick: () => setModal(r) },
                      { label: r.isOpen ? 'Force Close' : 'Force Open', onClick: () => void patch(r.id, { isOpen: !r.isOpen }, r.name) },
                      { separator: true, label: '', onClick: () => {} },
                      { label: r.isActive ? 'Deactivate' : 'Activate', danger: r.isActive, onClick: () => void patch(r.id, { isActive: !r.isActive }, r.name) },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {restaurants.length === 0 && !loading && <EmptyState label="No restaurants found" />}
        </div>
      </Panel>
    </div>
  )
}
