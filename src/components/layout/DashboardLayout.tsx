import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function DashboardLayout({ children }: { children: ReactNode }) {
  // On desktop (≥768px) start with sidebar open; on mobile start closed
  const [sidebarOpen,      setSidebarOpen]      = useState(() => window.innerWidth >= 769)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Stable callbacks — no new references on re-render
  const handleClose          = useCallback(() => setSidebarOpen(false), [])
  const handleToggleCollapse = useCallback(() => setSidebarCollapsed((c) => !c), [])
  const handleMenuClick      = useCallback(() => setSidebarOpen((o) => !o), [])

  // Close sidebar when a nav item is clicked — mobile only
  const handleNavClick = useCallback(() => {
    if (window.matchMedia('(max-width: 768px)').matches) setSidebarOpen(false)
  }, [])

  return (
    <div className={`shell${sidebarOpen ? ' sidebar-is-open' : ''}${sidebarCollapsed ? ' shell-collapsed' : ''}`}>
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={handleClose}
        onToggleCollapse={handleToggleCollapse}
        onNavClick={handleNavClick}
      />
      <div className="main-area">
        <Navbar onMenuClick={handleMenuClick} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
