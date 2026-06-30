import { useCallback, useEffect, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import type { PlatformSetting } from '../types'

export default function SettingsPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()
  const [settings, setSettings] = useState<PlatformSetting[]>([])
  const [draft,    setDraft]    = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { settings } = await apiFetch<{ settings: PlatformSetting[] }>('/admin/settings', token)
      setSettings(settings)
      const d: Record<string, string> = {}
      for (const s of settings) d[s.key] = s.value
      setDraft(d)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [token, notify])

  useEffect(() => { void load() }, [load])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const entries = Object.entries(draft).map(([key, value]) => ({ key, value }))
      await apiFetch('/admin/settings', token, { method: 'PUT', body: JSON.stringify({ entries }) })
      notify('success', 'Settings saved')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const groups = settings.reduce<Record<string, PlatformSetting[]>>((acc, s) => {
    ;(acc[s.category] ??= []).push(s)
    return acc
  }, {})

  const categoryIcons: Record<string, string> = {
    GENERAL: '⚙️', DELIVERY: '🛵', PAYMENT: '💳', NOTIFICATIONS: '🔔',
    SECURITY: '🔒', FEATURES: '✨',
  }

  return (
    <div className="page">
      <Toast toast={toast} />

      <PageHeader
        title="Platform Settings"
        count={settings.length || undefined}
        sub="Configure system-wide platform behaviour"
        actions={
          <>
            <button className="btn-secondary" onClick={() => void load()} disabled={loading}>
              {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
              {loading ? 'Loading…' : 'Reload'}
            </button>
          </>
        }
      />

      {settings.length === 0 && !loading ? (
        <EmptyState label="No settings found" />
      ) : (
        <form onSubmit={(e) => void save(e)}>
          <div className="flex flex-col gap-5">
            {Object.entries(groups).map(([category, items]) => (
              <Panel
                key={category}
                title={`${categoryIcons[category] ?? '·'} ${category}`}
              >
                <div className="settings-grid">
                  {items.map((s) => (
                    <Field key={s.key} label={s.key.replace(/_/g, ' ')}>
                      <input
                        value={draft[s.key] ?? ''}
                        onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                      />
                    </Field>
                  ))}
                </div>
              </Panel>
            ))}
          </div>

          {/* Sticky save bar */}
          <div className="sticky bottom-6 mt-6 flex justify-end">
            <button
              className="btn-primary flex items-center gap-2 shadow-xl"
              type="submit"
              disabled={saving}
            >
              {saving ? <Spinner size={14} /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save All Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
