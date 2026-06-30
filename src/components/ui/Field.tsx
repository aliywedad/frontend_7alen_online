import type { ReactNode } from 'react'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      {children}
      {hint && <small className="text-xs text-gray-400">{hint}</small>}
    </label>
  )
}
