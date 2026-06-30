import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, UtensilsCrossed, Car, Users, Truck,
  Tag, Image, Star, Bell, BarChart3, Settings, ClipboardList,
  ChevronLeft, ChevronRight, X, LogOut, MessageCircle, PhoneCall,
} from 'lucide-react'
import { NAV_ITEMS } from '../../constants'
import { useAuth } from '../../context/AuthContext'

type NavIconId = typeof NAV_ITEMS[number]['id']

const ICONS: Record<NavIconId, React.ComponentType<{ size?: number }>> = {
  overview:      LayoutDashboard,
  orders:        Package,
  restaurants:   UtensilsCrossed,
  drivers:       Car,
  users:         Users,
  courier:       Truck,
  coupons:       Tag,
  banners:       Image,
  reviews:       Star,
  notifications: Bell,
  analytics:     BarChart3,
  settings:      Settings,
  audit:         ClipboardList,
  whatsapp:         MessageCircle,
  calls:            PhoneCall,
}

type Props = {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
  onNavClick: () => void
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse, onNavClick }: Props) {
  const { adminName, logout, hasPermission } = useAuth()
  const visibleItems = NAV_ITEMS.filter(item => item.permission === null || hasPermission(item.permission))

  return (
    <>
      {/* Backdrop — mobile only (CSS hides on desktop) */}
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar${open ? ' sidebar-open' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <img src="/logo.png" alt="7alan" className="sidebar-logo" />
          {/* {!collapsed && <span className="sidebar-brand">7alan</span>} */}

          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand' : 'Collapse to icons'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button className="sidebar-close-btn" onClick={onClose} title="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = ICONS[item.id]
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={onNavClick}
              >
                <span className="nav-icon"><Icon size={18} /></span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && <span className="sidebar-user">{adminName}</span>}
          <button className="sidebar-logout" onClick={logout} title="Logout">
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
  