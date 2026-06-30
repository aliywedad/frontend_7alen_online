import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'

import LoginPage          from './pages/LoginPage'
import OverviewPage       from './pages/OverviewPage'
import OrdersPage         from './pages/OrdersPage'
import RestaurantsPage    from './pages/RestaurantsPage'
import RestaurantMenuPage from './pages/RestaurantMenuPage'
import DriversPage        from './pages/DriversPage'
import UsersPage               from './pages/UsersPage'
import UserPermissionsPage     from './pages/UserPermissionsPage'
import CourierPage        from './pages/CourierPage'
import CouponsPage        from './pages/CouponsPage'
import BannersPage        from './pages/BannersPage'
import ReviewsPage        from './pages/ReviewsPage'
import NotificationsPage  from './pages/NotificationsPage'
import AnalyticsPage      from './pages/AnalyticsPage'
import SettingsPage       from './pages/SettingsPage'
import AuditLogPage          from './pages/AuditLogPage'
import WhatsAppPage          from './pages/WhatsAppPage'
import WhatsAppMessagesPage  from './pages/WhatsAppMessagesPage'
import CallPage              from './pages/CallPage'

function PermissionGuard({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) return <Navigate to="/" replace />
  return <>{children}</>
}

function ProtectedRoutes() {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />

        <Route path="/orders" element={
          <PermissionGuard permission="orders"><OrdersPage /></PermissionGuard>
        } />
        <Route path="/restaurants" element={
          <PermissionGuard permission="restaurants"><RestaurantsPage /></PermissionGuard>
        } />
        <Route path="/restaurants/:id/menu" element={
          <PermissionGuard permission="restaurants"><RestaurantMenuPage /></PermissionGuard>
        } />
        <Route path="/drivers" element={
          <PermissionGuard permission="drivers"><DriversPage /></PermissionGuard>
        } />
        <Route path="/users" element={
          <PermissionGuard permission="users"><UsersPage /></PermissionGuard>
        } />
        <Route path="/users/:id/permissions" element={
          <PermissionGuard permission="users"><UserPermissionsPage /></PermissionGuard>
        } />
        <Route path="/courier" element={
          <PermissionGuard permission="courier"><CourierPage /></PermissionGuard>
        } />
        <Route path="/coupons" element={
          <PermissionGuard permission="coupons"><CouponsPage /></PermissionGuard>
        } />
        <Route path="/banners" element={
          <PermissionGuard permission="banners"><BannersPage /></PermissionGuard>
        } />
        <Route path="/reviews" element={
          <PermissionGuard permission="reviews"><ReviewsPage /></PermissionGuard>
        } />
        <Route path="/notifications" element={
          <PermissionGuard permission="notifications"><NotificationsPage /></PermissionGuard>
        } />
        <Route path="/analytics" element={
          <PermissionGuard permission="analytics"><AnalyticsPage /></PermissionGuard>
        } />
        <Route path="/settings" element={
          <PermissionGuard permission="settings"><SettingsPage /></PermissionGuard>
        } />

        <Route path="/audit" element={
          <PermissionGuard permission="audit"><AuditLogPage /></PermissionGuard>
        } />
        <Route path="/whatsapp" element={
          <PermissionGuard permission="settings"><WhatsAppPage /></PermissionGuard>
        } />
        <Route path="/whatsapp-messages" element={
          <PermissionGuard permission="settings"><WhatsAppMessagesPage /></PermissionGuard>
        } />
        <Route path="/calls" element={
          <PermissionGuard permission="settings"><CallPage /></PermissionGuard>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*"     element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
