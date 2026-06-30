import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NAV_ITEMS } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import type { ReactNode } from 'react'

type Props = {
  onMenuClick: () => void
  children?: ReactNode
}

export function Navbar({ onMenuClick, children }: Props) {
  const location = useLocation()
  const { role, permissions } = useAuth()
  const currentItem = NAV_ITEMS.find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path),
  )
  const pageLabel = currentItem?.label ?? 'Dashboard'

  return (
    <header className="navbar   ">
      <div className="navbar-left ">
        <button
          className="hamburger"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none mb-0.5">
            7alan Admin
          </span>
          <h1 className="text-base font-extrabold text-gray-900 leading-none">{pageLabel}</h1>
        </div>
      </div>

      <div className="navbar-right ">
        {children}

        {/* Role badge */}
        {role === 'SUPERADMIN' ? (
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-amber-700">Super Admin</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5" title={`Permissions: ${permissions.join(', ') || 'none'}`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-gray-600">Admin</span>
            <span className="text-[10px] text-gray-400 font-medium">{permissions.length}/{11}</span>
          </div>
        )}
      </div>
    </header>
  )
}
