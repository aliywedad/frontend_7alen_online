import { ChevronDown } from 'lucide-react'

type SelectProps = {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  compact?: boolean
  className?: string
}

export function Select({ value, options, onChange, compact = false, className = '' }: SelectProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        className={[
          'appearance-none bg-white border border-gray-200 rounded-xl font-semibold text-gray-700',
          'outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer',
          'transition-all duration-150',
          compact ? 'text-xs pl-2.5 pr-6 py-1.5' : 'text-sm pl-3 pr-7 py-2.5',
        ].join(' ')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <ChevronDown
        size={compact ? 11 : 13}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  )
}
