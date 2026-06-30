import type { ReactNode } from 'react'

type Props = {
  title: string
  sub?: string
  count?: number | string
  actions?: ReactNode
  icon?: ReactNode
}

export function PageHeader({ title, sub, count, actions, icon }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
          {count !== undefined && count !== 0 && (
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {count}
            </span>
          )}
        </div>
        {sub && <p className="mt-0.5 text-sm text-gray-400 font-medium">{sub}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
      )}
    </div>
  )
}
