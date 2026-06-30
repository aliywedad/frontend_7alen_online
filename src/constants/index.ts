export const COLORS = {
  primary: '#fdae00',
  primaryDark: '#e09900',
  secondary: '#d13100',
  secondaryDark: '#b02800',
  sidebarBg: '#0f0500',
  bg: '#f4f6f9',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#0d1b2a',
  textMuted: '#6b7280',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
} as const

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://backend7alenonline-production.up.railway.app/api'

export const ROUTES = {
  login: '/login',
  overview: '/',
  orders: '/orders',
  restaurants: '/restaurants',
  drivers: '/drivers',
  users: '/users',
  courier: '/courier',
  coupons: '/coupons',
  banners: '/banners',
  reviews: '/reviews',
  notifications: '/notifications',
  analytics: '/analytics',
  settings: '/settings',
  audit: '/audit',
  whatsapp: '/whatsapp',
  whatsappMessages: '/whatsapp-messages',
  calls: '/calls',
} as const

export const NAV_ITEMS = [
  { id: 'overview',       label: 'Overview',       path: ROUTES.overview,       exact: true,  permission: null           },
  { id: 'orders',         label: 'Orders',          path: ROUTES.orders,         exact: false, permission: 'orders'       },
  { id: 'restaurants',    label: 'Restaurants',     path: ROUTES.restaurants,    exact: false, permission: 'restaurants'  },
  { id: 'drivers',        label: 'Drivers',         path: ROUTES.drivers,        exact: false, permission: 'drivers'      },
  { id: 'users',          label: 'Users',           path: ROUTES.users,          exact: false, permission: 'users'        },
  { id: 'courier',        label: 'Courier',         path: ROUTES.courier,        exact: false, permission: 'courier'      },
  { id: 'coupons',        label: 'Coupons',         path: ROUTES.coupons,        exact: false, permission: 'coupons'      },
  { id: 'banners',        label: 'Banners',         path: ROUTES.banners,        exact: false, permission: 'banners'      },
  { id: 'reviews',        label: 'Reviews',         path: ROUTES.reviews,        exact: false, permission: 'reviews'      },
  { id: 'notifications',  label: 'Notifications',   path: ROUTES.notifications,  exact: false, permission: 'notifications'},
  { id: 'analytics',      label: 'Analytics',       path: ROUTES.analytics,      exact: false, permission: 'analytics'   },
  { id: 'settings',       label: 'Settings',        path: ROUTES.settings,       exact: false, permission: 'settings'    },
  { id: 'audit',          label: 'Audit Log',       path: ROUTES.audit,          exact: false, permission: 'audit'       },
  { id: 'whatsapp',       label: 'WhatsApp',        path: ROUTES.whatsapp,       exact: false, permission: 'settings'    },
  { id: 'calls',          label: 'Support Calls',   path: ROUTES.calls,          exact: false, permission: 'settings'    },
] as const

export const ALL_PERMISSIONS = [
  'orders', 'restaurants', 'drivers', 'users', 'courier',
  'coupons', 'banners', 'reviews', 'notifications', 'analytics', 'settings', 'audit',
] as const
export type Permission = typeof ALL_PERMISSIONS[number]

export const ORDER_STATUSES    = ['PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','PICKED_UP','DELIVERED','CANCELLED'] as const
export const COURIER_STATUSES  = ['PENDING','ASSIGNED','PICKED_UP','DELIVERED','CANCELLED'] as const
export const ROLE_FILTERS      = ['ALL','SUPERADMIN','ADMIN','CUSTOMER','DRIVER','RESTAURANT_OWNER'] as const
export const COUPON_TYPES      = ['PERCENTAGE','FIXED','FREE_DELIVERY'] as const
export const COUPON_SCOPES     = ['ALL','STORE_TYPE','RESTAURANT'] as const
export const NOTIFICATION_TYPES = ['INFO','PROMO','ORDER','SYSTEM'] as const
export const STORE_TYPES       = ['FOOD','GROCERY','PHARMACY'] as const
export const VEHICLE_TYPES     = ['MOTO','CAR','TRUCK','BICYCLE'] as const
export const LANGUAGES         = ['EN','AR','FR'] as const
