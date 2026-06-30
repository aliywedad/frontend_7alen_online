import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw, ImageIcon } from 'lucide-react'
import { confirmDelete } from '../utils/swal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { API_URL } from '../constants'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { BoolBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { RowActions } from '../components/ui/RowActions'
import { fmtDate } from '../utils/format'
import type { Banner } from '../types'

type Draft = Partial<Banner>
const BLANK: Draft = { title: '', subtitle: '', backgroundColor: '#d13100', sortOrder: 0, isActive: true }

export default function BannersPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [banners,   setBanners]   = useState<Banner[]>([])
  const [loading,   setLoading]   = useState(true)
  const [draft,     setDraft]     = useState<Draft>(BLANK)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { banners } = await apiFetch<{ banners: Banner[] }>('/admin/banners', token)
      setBanners(banners)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => { void load() }, [load])

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title) return notify('error', 'Title required')
    const isEdit = Boolean(draft.id)
    try {
      await apiFetch(
        isEdit ? `/admin/banners/${draft.id}` : '/admin/banners',
        token,
        {
          method: isEdit ? 'PATCH' : 'POST',
          body: JSON.stringify({
            title: draft.title, subtitle: draft.subtitle, image: draft.image,
            backgroundColor: draft.backgroundColor, ctaText: draft.ctaText, ctaUrl: draft.ctaUrl,
            storeType: draft.storeType, restaurantId: draft.restaurantId,
            sortOrder: draft.sortOrder, isActive: draft.isActive,
            startsAt: draft.startsAt, endsAt: draft.endsAt,
          }),
        },
      )
      notify('success', isEdit ? 'Banner updated' : 'Banner created')
      setDraft(BLANK)
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const del = async (id: string, title: string) => {
    if (!await confirmDelete(`Delete banner "${title}"?`)) return
    try {
      await apiFetch(`/admin/banners/${id}`, token, { method: 'DELETE' })
      notify('success', 'Banner deleted')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      set({ image: json.url })
      notify('success', 'Image uploaded')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const isEdit = Boolean(draft.id)

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Banners"
        count={banners.length || undefined}
        sub="Promotional banners displayed in the customer app"
        actions={
          <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        }
      />

      <div className="grid-two">
        {/* Form */}
        <Panel title={isEdit ? 'Edit Banner' : 'New Banner'}>
          <form className="form-stack" onSubmit={(e) => void submit(e)}>
            <Field label="Title">
              <input value={draft.title ?? ''} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <input value={draft.subtitle ?? ''} onChange={(e) => set({ subtitle: e.target.value })} />
            </Field>

            <Field label="Banner Image">
              {draft.image ? (
                <div className="banner-preview" style={{ background: draft.backgroundColor ?? '#d13100' }}>
                  <img src={draft.image} alt="preview" />
                  <button type="button" className="banner-remove" onClick={() => set({ image: undefined })}>✕ Remove</button>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 h-24 flex items-center justify-center text-gray-300 bg-gray-50">
                  <ImageIcon size={28} />
                </div>
              )}
              <div className="form-row mt-2">
                <label className="upload-label">
                  {uploading ? <><Spinner size={13} className="mr-1" /> Uploading…</> : '↑ Upload image'}
                  <input
                    type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f) }}
                  />
                </label>
                <input placeholder="or paste URL…" value={draft.image ?? ''} onChange={(e) => set({ image: e.target.value })} style={{ flex: 2 }} />
              </div>
            </Field>

            <div className="form-row">
              <Field label="Background color">
                <input type="color" value={draft.backgroundColor ?? '#d13100'} onChange={(e) => set({ backgroundColor: e.target.value })} className="h-10 cursor-pointer" />
              </Field>
              <Field label="Sort order">
                <input type="number" value={draft.sortOrder ?? 0} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="form-row">
              <Field label="CTA text">
                <input value={draft.ctaText ?? ''} onChange={(e) => set({ ctaText: e.target.value })} placeholder="Order Now" />
              </Field>
              <Field label="CTA URL">
                <input value={draft.ctaUrl ?? ''} onChange={(e) => set({ ctaUrl: e.target.value })} />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Store type">
                <input value={draft.storeType ?? ''} onChange={(e) => set({ storeType: e.target.value || null })} placeholder="FOOD / GROCERY…" />
              </Field>
              <Field label="Restaurant ID">
                <input value={draft.restaurantId ?? ''} onChange={(e) => set({ restaurantId: e.target.value || null })} />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Starts at">
                <input type="datetime-local" value={draft.startsAt ? draft.startsAt.slice(0, 16) : ''} onChange={(e) => set({ startsAt: e.target.value || null })} />
              </Field>
              <Field label="Ends at">
                <input type="datetime-local" value={draft.endsAt ? draft.endsAt.slice(0, 16) : ''} onChange={(e) => set({ endsAt: e.target.value || null })} />
              </Field>
            </div>

            <label className="checkbox-label">
              <input type="checkbox" checked={draft.isActive ?? true} onChange={(e) => set({ isActive: e.target.checked })} />
              Active
            </label>

            <div className="flex gap-3">
              <button className="btn-primary flex-1 justify-center" type="submit">
                {isEdit ? 'Save Changes' : <><Plus size={15} /> Create Banner</>}
              </button>
              {isEdit && (
                <button type="button" className="btn-secondary" onClick={() => setDraft(BLANK)}>Cancel</button>
              )}
            </div>
          </form>
        </Panel>

        {/* Banner list */}
        <Panel title={`Banners (${banners.length})`} noPad>
          <div className="cards-list">
            {banners.map((b) => (
              <div className="entity-card banner-card" key={b.id}>
                <div className="banner-thumb" style={{ background: b.backgroundColor ?? '#d13100' }}>
                  {b.image && <img src={b.image} alt={b.title} />}
                  <div className="banner-thumb-text">
                    <strong>{b.title}</strong>
                    {b.subtitle && <span>{b.subtitle}</span>}
                  </div>
                  <BoolBadge value={b.isActive} />
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 w-full flex-wrap gap-2">
                  <div className="card-meta">
                    {b.storeType && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{b.storeType}</span>
                    )}
                    <span className="text-xs text-gray-400">#{b.sortOrder}</span>
                    {b.endsAt && <span className="text-xs text-gray-400">ends {fmtDate(b.endsAt)}</span>}
                  </div>
                  <RowActions actions={[
                    { label: 'Edit', onClick: () => setDraft(b) },
                    { label: 'Delete', danger: true, onClick: () => void del(b.id, b.title ?? '') },
                  ]} />
                </div>
              </div>
            ))}
            {banners.length === 0 && !loading && <EmptyState label="No banners yet" />}
          </div>
        </Panel>
      </div>
    </div>
  )
}
