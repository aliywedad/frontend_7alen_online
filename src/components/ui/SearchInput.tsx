import { Search } from 'lucide-react'

type Props = {
  value: string
  onChange: (v: string) => void
  onSearch?: () => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, onSearch, placeholder = 'Search…', className = '' }: Props) {
  return (
    <div className={`relative flex-1 min-w-[180px] max-w-sm ${className}`}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
        placeholder={placeholder}
        style={{ paddingLeft: '34px' }}
      />
    </div>
  )
}
