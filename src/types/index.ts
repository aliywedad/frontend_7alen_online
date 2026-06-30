export type Stats = {
  users: number
  customers: number
  drivers: number
  restaurants: number
  activeRestaurants: number
  orders: number
  pendingOrders: number
  deliveredOrders: number
  courierRequests: number
  pendingCourierRequests: number
  onlineDrivers: number
  revenue: number
  deliveryFees: number
}

export type User = {
  id: string
  phone: string
  name: string
  email?: string | null
  avatar?: string | null
  role: string
  isActive: boolean
  walletBalance: number
  loyaltyPoints: number
  referralCode?: string | null
  language: string
  createdAt: string
  adminPermissions?: string[]
  restaurant?: { id: string; name: string; isActive: boolean } | null
  driverProfile?: { id: string; vehicleType: string; vehiclePlate: string; isOnline: boolean } | null
  _count?: { orders: number; courierRequests: number }
}

export type Restaurant = {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  logo?: string | null
  coverImage?: string | null
  category: string
  storeType: string
  address: string
  phone: string
  isOpen: boolean
  isActive: boolean
  deliveryFee: number
  minOrder: number
  deliveryTime: number
  rating: number
  totalOrders: number
  createdAt: string
  owner: { name: string; phone: string; isActive?: boolean }
}

export type MenuItem = {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  isAvailable: boolean
  categoryId: string
}

export type MenuCategory = {
  id: string
  name: string
  image?: string | null
  restaurantId: string
  items: MenuItem[]
}

export type RestaurantWithMenu = Restaurant & {
  categories: MenuCategory[]
}

export type DriverProfile = {
  id: string
  vehicleType: string
  vehiclePlate: string
  isOnline: boolean
  currentLat?: number | null
  currentLng?: number | null
  rating: number
  totalDeliveries: number
  earnings: number
  totalTips: number
  user: { id: string; name: string; phone: string; isActive: boolean }
}

export type OrderItem = {
  id: string
  quantity: number
  price: number
  notes?: string | null
  menuItem: { name: string }
}

export type Order = {
  id: string
  status: string
  subtotal: number
  deliveryFee: number
  total: number
  discount: number
  tip: number
  couponCode?: string | null
  deliveryAddress: string
  paymentMethod: string
  notes?: string | null
  estimatedTime?: number | null
  createdAt: string
  customer: { name: string; phone: string }
  restaurant: { name: string }
  driver?: { user: { name: string; phone: string } } | null
  items?: OrderItem[]
}

export type CourierRequest = {
  id: string
  status: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropAddress: string
  dropLat: number
  dropLng: number
  packageSize: string
  notes?: string | null
  fee: number
  distance?: number | null
  estimatedTime?: number | null
  createdAt: string
  customer: { name: string; phone: string }
  driver?: { id: string; user: { name: string; phone: string } } | null
}

export type Coupon = {
  id: string
  code: string
  description?: string | null
  type: string
  value: number
  minOrder: number
  maxDiscount?: number | null
  usageLimit?: number | null
  usedCount: number
  perUserLimit: number
  startsAt?: string | null
  expiresAt?: string | null
  isActive: boolean
  scope: string
  storeType?: string | null
  restaurantId?: string | null
  restaurant?: { id: string; name: string } | null
  createdAt: string
}

export type Banner = {
  id: string
  title: string
  subtitle?: string | null
  image?: string | null
  backgroundColor?: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  storeType?: string | null
  restaurantId?: string | null
  sortOrder: number
  isActive: boolean
  startsAt?: string | null
  endsAt?: string | null
  restaurant?: { id: string; name: string } | null
  createdAt: string
}

export type Review = {
  id: string
  rating: number
  driverRating?: number | null
  comment?: string | null
  createdAt: string
  orderId?: string | null
  user?: { name: string; phone: string }
  restaurant?: { name: string } | null
  driver?: { user: { name: string } } | null
}

export type Notification = {
  id: string
  userId?: string | null
  title: string
  body: string
  type: string
  data?: string | null
  read: boolean
  createdAt: string
  user?: { name: string; phone: string } | null
}

export type PlatformSetting = {
  id: string
  key: string
  value: string
  category: string
}

export type WhatsAppMessage = {
  id: string
  adminId: string | null
  admin: { id: string; name: string; role: string } | null
  recipient: string
  content: string
  type: 'MANUAL' | 'OTP'
  status: 'SENT' | 'FAILED'
  error?: string | null
  createdAt: string
}

export type AuditLog = {
  id: string
  adminId: string
  admin?: { id: string; name: string; role: string }
  action: string
  page: string
  resourceId?: string | null
  resourceName?: string | null
  details?: string | null
  createdAt: string
}

export type Analytics = {
  range: { days: number; since: string }
  summary: { deliveredOrders: number; revenue: number; deliveryFees: number; tips: number; discounts: number }
  byDay: { date: string; orders: number; revenue: number }[]
  statusBreakdown: { status: string; count: number }[]
  topRestaurants: { id: string; name: string; totalOrders: number; rating: number }[]
  topDrivers: { id: string; vehicleType: string; vehiclePlate: string; totalDeliveries: number; earnings: number; rating: number; user: { name: string } }[]
}
