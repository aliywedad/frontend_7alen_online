import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Upload, X, FolderPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Spinner } from '../components/ui/Spinner'
import { confirmAction } from '../utils/swal'
import { money } from '../utils/format'
import type { MenuCategory, MenuItem, RestaurantWithMenu } from '../types'

// ── Item form modal ────────────────────────────────────────────────────────────

type ItemFormProps = {
  restaurantId: string
  categories: MenuCategory[]
  item?: MenuItem | null
  defaultCategoryId?: string
  onClose: () => void
  onSaved: () => void
  notify: (type: 'success' | 'error', message: string) => void
}

function ItemForm({ restaurantId, categories, item, defaultCategoryId, onClose, onSaved, notify }: ItemFormProps) {
  const { token } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName]               = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice]             = useState(item?.price?.toString() ?? '')
  const [categoryId, setCategoryId]   = useState(item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '')
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true)
  const [image, setImage]           = useState(item?.image ?? '')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview]         = useState(item?.image ?? '')
  const [saving, setSaving]           = useState(false)

  const pickFile = (file: File) => {
    setPendingFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setPendingFile(null)
    setPreview('')
    setImage('')
  }

  const save = async () => {
    if (!name.trim() || !price || !categoryId) {
      notify('error', 'Name, price and category are required')
      return
    }
    setSaving(true)
    try {
      let finalImage = image
      if (pendingFile) {
        const form = new FormData()
        form.append('file', pendingFile)
        const { url } = await apiFetch<{ url: string }>('/upload', token, { method: 'POST', body: form })
        finalImage = url
      }
      const body = JSON.stringify({ name: name.trim(), description: description.trim() || null, price: parseFloat(price), image: finalImage || null, categoryId, isAvailable })
      if (item) {
        await apiFetch(`/admin/restaurants/${restaurantId}/menu/items/${item.id}`, token, { method: 'PUT', body })
      } else {
        await apiFetch(`/admin/restaurants/${restaurantId}/menu/items`, token, { method: 'POST', body })
      }
      onSaved()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">{item ? 'Edit Item' : 'New Item'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Image</label>
            <div
              className="relative w-full h-44 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <>
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  {pendingFile && (
                    <span className="absolute bottom-2 left-2 text-[10px] bg-yellow-500 text-white px-2 py-0.5 rounded-full font-semibold">Pending upload</span>
                  )}
                  <button
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); clearImage() }}
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload size={28} />
                  <span className="text-xs">Click to upload image</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cheese Burger" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              className="w-full px-3 py-2 border-1.5 border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
            />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Price (MRU) *</label>
              <input type="number" min="0" step="0.5" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Category *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Available */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={() => setIsAvailable(v => !v)}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isAvailable ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Available</span>
          </label>
        </div>

        {/* footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? <Spinner size={13} /> : null}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add category modal ─────────────────────────────────────────────────────────

type AddCatProps = { restaurantId: string; onClose: () => void; onSaved: () => void; notify: (type: 'success' | 'error', message: string) => void }

function AddCategoryForm({ restaurantId, onClose, onSaved, notify }: AddCatProps) {
  const { token } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await apiFetch(`/admin/restaurants/${restaurantId}/menu/categories`, token, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      })
      onSaved()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">New Category</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Category name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Burgers" autoFocus onKeyDown={e => { if (e.key === 'Enter') void save() }} />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => void save()} disabled={saving || !name.trim()}>
            {saving ? <Spinner size={13} /> : null}
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Item card ──────────────────────────────────────────────────────────────────

type ItemCardProps = {
  item: MenuItem
  onEdit: () => void
}

function ItemCard({ item, onEdit }: ItemCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
      onClick={onEdit}
    >
      {/* Image */}
      <div className="w-full h-36 bg-gray-100 overflow-hidden relative">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        {/* availability badge */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {item.isAvailable ? 'Available' : 'Sold out'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-primary">{money(item.price)}</span>
          <span className="text-gray-300 group-hover:text-primary transition-colors"><Pencil size={12} /></span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RestaurantMenuPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const navigate = useNavigate()

  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null)
  const [loading, setLoading]       = useState(true)
  const [editItem, setEditItem]     = useState<MenuItem | null | 'new'>(null)
  const [newItemCat, setNewItemCat] = useState<string>('')
  const [showAddCat, setShowAddCat] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { restaurant } = await apiFetch<{ restaurant: RestaurantWithMenu }>(`/admin/restaurants/${id}/menu`, token)
      setRestaurant(restaurant)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id, token, notify])

  useEffect(() => { void load() }, [load])

  const deleteItem = async (item: MenuItem) => {
    if (!restaurant) return
    if (!await confirmAction(`Delete "${item.name}"?`, 'This cannot be undone.', 'Delete')) return
    try {
      await apiFetch(`/admin/restaurants/${restaurant.id}/menu/items/${item.id}`, token, { method: 'DELETE' })
      notify('success', 'Item deleted')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const deleteCategory = async (cat: MenuCategory) => {
    if (!restaurant) return
    if (!await confirmAction(`Delete category "${cat.name}"?`, `This will also delete all ${cat.items.length} items in it.`, 'Delete')) return
    try {
      await apiFetch(`/admin/restaurants/${restaurant.id}/menu/categories/${cat.id}`, token, { method: 'DELETE' })
      notify('success', 'Category deleted')
      void load()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    }
  }

  const totalItems = restaurant?.categories.reduce((s, c) => s + c.items.length, 0) ?? 0

  return (
    <div className="page">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => navigate('/restaurants')}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{restaurant?.name ?? 'Menu'}</h1>
          {restaurant && (
            <p className="text-xs text-gray-400">{restaurant.categories.length} categories · {totalItems} items</p>
          )}
        </div>
        <button
          className="btn-secondary flex items-center gap-1.5"
          onClick={() => setShowAddCat(true)}
        >
          <FolderPlus size={14} /> Add Category
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      )}

      {!loading && restaurant && restaurant.categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <FolderPlus size={40} strokeWidth={1.2} />
          <p className="font-medium">No categories yet</p>
          <button className="btn-primary" onClick={() => setShowAddCat(true)}>Add first category</button>
        </div>
      )}

      {/* Categories */}
      {!loading && restaurant && restaurant.categories.map(cat => (
        <div key={cat.id} className="mb-8">
          {/* Category header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{cat.name}</h2>
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{cat.items.length}</span>
            </div>
            <div className="flex gap-2">
              <button
                className="btn-xs flex items-center gap-1"
                onClick={() => { setNewItemCat(cat.id); setEditItem('new') }}
              >
                <Plus size={11} /> Add item
              </button>
              <button
                className="btn-xs btn-danger flex items-center gap-1"
                onClick={() => void deleteCategory(cat)}
              >
                <Trash2 size={11} /> Delete category
              </button>
            </div>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {cat.items.map(item => (
              <div key={item.id} className="relative group/card">
                <ItemCard item={item} onEdit={() => setEditItem(item)} />
                <button
                  className="absolute top-2 left-2 opacity-0 group-hover/card:opacity-100 transition-opacity bg-red-600 text-white rounded-full p-1 shadow"
                  onClick={(e) => { e.stopPropagation(); void deleteItem(item) }}
                  title="Delete item"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            {/* Add item card */}
            <button
              className="rounded-xl border-2 border-dashed border-gray-200 h-[200px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors"
              onClick={() => { setNewItemCat(cat.id); setEditItem('new') }}
            >
              <Plus size={24} strokeWidth={1.5} />
              <span className="text-xs font-medium">Add item</span>
            </button>
          </div>
        </div>
      ))}

      {/* Modals */}
      {editItem !== null && restaurant && (
        <ItemForm
          restaurantId={restaurant.id}
          categories={restaurant.categories}
          item={editItem === 'new' ? null : editItem}
          defaultCategoryId={editItem === 'new' ? newItemCat : undefined}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); void load() }}
          notify={notify}
        />
      )}

      {showAddCat && restaurant && (
        <AddCategoryForm
          restaurantId={restaurant.id}
          onClose={() => setShowAddCat(false)}
          onSaved={() => { setShowAddCat(false); void load() }}
          notify={notify}
        />
      )}
    </div>
  )
}
