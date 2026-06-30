type StatCardProps = {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  accent?: boolean
}

export function StatCard({ label, value, sub, icon, accent = false }: StatCardProps) {
  return (
    <article className={[
      'relative bg-white rounded-2xl p-5 shadow-sm border overflow-hidden',
      'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
      accent
        ? 'border-l-4 border-l-primary border-t border-r border-b border-gray-100'
        : 'border border-gray-100',
    ].join(' ')}>
      {/* Subtle amber glow on accent */}
      {accent && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
      )}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 leading-tight">
          {label}
        </span>
        {icon && (
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
            {icon}
          </span>
        )}
      </div>
      <strong className="block mt-2.5 text-2xl font-extrabold text-gray-900 leading-none">
        {value}
      </strong>
      {sub && (
        <small className="block mt-1.5 text-xs text-gray-400 font-medium">{sub}</small>
      )}
    </article>
  )
}
