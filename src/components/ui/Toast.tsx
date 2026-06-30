import { CheckCircle2, XCircle } from 'lucide-react'
import type { ToastState } from '../../hooks/useToast'

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div
      className={[
        'fixed top-5 right-5 z-[9999] flex items-center gap-3',
        'min-w-[260px] max-w-[400px] px-4 py-3.5 rounded-2xl shadow-2xl',
        'text-sm font-bold select-none',
        'animate-[slideIn_0.25s_cubic-bezier(0.4,0,0.2,1)]',
        ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
      ].join(' ')}
    >
      {ok
        ? <CheckCircle2 size={18} className="shrink-0 opacity-90" />
        : <XCircle     size={18} className="shrink-0 opacity-90" />}
      <span>{toast.message}</span>
    </div>
  )
}
