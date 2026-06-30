import type { ReactNode } from 'react'

type PanelProps = {
  title: ReactNode
  tools?: ReactNode
  children: ReactNode
  className?: string
  noPad?: boolean
}

export function Panel({ title, tools, children, className = '', noPad = false }: PanelProps) {
  return (
    <section className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
        {tools && <div className="flex items-center gap-2 flex-wrap">{tools}</div>}
      </div>
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </section>
  )
}
