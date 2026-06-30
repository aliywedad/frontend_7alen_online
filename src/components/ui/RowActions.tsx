import { useEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'

export type RowAction = {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  separator?: boolean
}

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', closeKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', closeKey)
    }
  }, [open])

  return (
    <div ref={ref} className="row-action-wrap">
      <button
        className="row-action-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Row actions"
        aria-expanded={open}
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="row-action-menu">
          {actions.map((a, i) =>
            a.separator ? (
              <div key={i} className="row-action-sep" />
            ) : (
              <button
                key={i}
                className={`row-action-item${a.danger ? ' row-action-item-danger' : ''}`}
                disabled={a.disabled}
                onClick={() => { setOpen(false); a.onClick() }}
              >
                {a.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
