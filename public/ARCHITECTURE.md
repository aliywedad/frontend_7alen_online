# 7alan Admin Web — Architecture & Tech Guide

> A complete reference for newcomers. Everything you need to understand what this app is, how it's built, and how to navigate it.

---

## What is this app?

The **admin-web** is the back-office control panel for the **7alan food delivery platform**. It is a web dashboard (runs in the browser) that lets a platform administrator manage the entire system: users, restaurants, drivers, orders, coupons, banners, notifications, and analytics.

It talks directly to the shared **backend** API (`http://192.168.100.3:3000/api`).

---

## Where does this fit in the 7alan monorepo?

```
7alan/
├── backend/          ← Express API that this dashboard talks to
├── customer-app/     ← Expo React Native (customer mobile app)
├── restaurant-app/   ← Expo React Native (restaurant owner portal)
├── driver-app/       ← Expo React Native (driver delivery app)
└── admin-web/        ← THIS app — React + Vite web dashboard
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI framework | **React** | 19 | Component model |
| Language | **TypeScript** | 6 | Type safety |
| Build tool | **Vite** | 8 | Dev server + production bundler |
| Styling | **Plain CSS** (`App.css`, `index.css`) | — | No CSS framework — handwritten |
| HTTP | **Fetch API** (native browser) | — | All API calls, no Axios |
| State | **React `useState`** | — | No external state library |
| Auth storage | **`localStorage`** | — | Token + admin name persisted here |
| Package manager | **pnpm** | — | `pnpm-lock.yaml` present |
| Linter | **ESLint** with `typescript-eslint` | 10 | `eslint.config.js` |

No UI component library is used — everything is custom HTML + CSS.

---

## Project File Structure

```
admin-web/
├── public/                   ← Static files served as-is
│   ├── logo.png              ← 7alan brand logo (used in sidebar + login)
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── main.tsx              ← Entry point — mounts <App /> into #root
│   ├── App.tsx               ← Entire application logic (single file, ~1100 lines)
│   ├── App.css               ← All component styles
│   └── index.css             ← Global resets and CSS variables
│
├── index.html                ← HTML shell — contains <div id="root">
├── vite.config.ts            ← Vite config (just the React plugin, nothing custom)
├── tsconfig.json             ← Root TS config
├── tsconfig.app.json         ← App-level TS config (target ES2023, strict linting)
├── tsconfig.node.json        ← TS config for vite.config.ts itself
├── eslint.config.js          ← ESLint rules
└── package.json              ← Dependencies and npm scripts
```

---

## Application Architecture

### Single-file Design

The entire app lives in **`src/App.tsx`**. There are no routing, no pages folder, no separate component files. Section switching is handled by a single `activeSection` state variable.

```
App.tsx
 ├── TypeScript type definitions (Stats, User, Order, Driver, ...)
 ├── Helper functions (money, shortId, statusClass)
 ├── App() — main component (all state, all data fetching, all rendering)
 │    ├── Login screen (when no token)
 │    └── Dashboard shell (sidebar + content area)
 │         ├── overview section
 │         ├── orders section
 │         ├── restaurants section
 │         ├── drivers section
 │         ├── users section
 │         ├── courier section
 │         ├── coupons section
 │         ├── banners section
 │         ├── reviews section
 │         ├── notifications section
 │         ├── analytics section
 │         └── settings section
 ├── Panel           — reusable section container (title + optional toolbar)
 ├── Select          — reusable <select> wrapper
 ├── Field           — reusable labeled input wrapper
 ├── OrderTable      — orders table with status changer
 ├── DriverTable     — drivers table with online toggle
 ├── NotificationList — notification feed
 ├── RankingList     — top-N ranked list
 └── EmptyState      — "No data" placeholder
```

### State Management

All state lives inside the single `App()` function via `useState`. Key pieces:

| State variable | What it holds |
|----------------|---------------|
| `token` | JWT auth token (read from `localStorage` on mount) |
| `adminName` | Logged-in admin's display name |
| `activeSection` | Which sidebar tab is currently shown |
| `data` | All fetched admin data: users, orders, drivers, etc. |
| `loading` | Global loading flag (while `loadData()` runs) |
| `search` | Search string (applied to users, orders, restaurants) |
| `roleFilter` | Filters the users list by role |
| `orderFilter` | Filters the orders list by status |
| `courierFilter` | Filters the courier list by status |
| `couponDraft` | Form state for the coupon create/edit form |
| `bannerDraft` | Form state for the banner create/edit form |
| `notificationDraft` | Form state for the notification composer |
| `settingsDraft` | Editable copy of platform settings from the API |
| `toast` | Temporary success/error toast message |

---

## Authentication Flow

```
1. User opens app
2. App checks localStorage for '7alan-admin-token'
3. If found → skip login screen, load data
4. If not found → show login form

Login:
  POST /api/auth/login { phone, password }
  Response: { token, user }
  If user.role !== 'ADMIN' → reject with error
  Else → save token + name to localStorage, set state

Logout:
  Remove localStorage keys, clear token state → login screen appears
```

Token is injected into every request via the `headers` memo:
```ts
Authorization: `Bearer ${token}`
```

---

## API Communication

All requests go through a single `api()` helper function inside `App()`:

```ts
const api = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(json.error || 'Request failed')
  return json
}
```

`API_URL` defaults to `http://localhost:3000/api` but can be overridden with the `VITE_API_URL` environment variable.

### Data Loading

`loadData()` fires **12 parallel requests** using `Promise.all()` every time a filter changes or the user clicks Refresh:

```
/admin/stats
/admin/users?role=...&search=...
/admin/restaurants?status=all&search=...
/admin/drivers
/admin/orders?status=...&search=...
/admin/courier?status=...
/admin/coupons
/admin/banners
/admin/notifications
/admin/reviews
/admin/settings
/admin/analytics?days=30
```

### Mutations

All writes go through `send()`:
```ts
send(path, body, successMessage, method?)
// method defaults to 'PATCH'
// after success: shows toast + re-runs loadData() to refresh
```

---

## Dashboard Sections

| Section | What it does |
|---------|-------------|
| **Overview** | Stat cards (revenue, orders, restaurants, drivers, users, courier) + recent orders + online drivers + notifications + top restaurants |
| **Orders** | Full order table with status filter + inline status changer |
| **Restaurants** | Restaurant cards with open/close and activate/deactivate toggles |
| **Drivers** | Driver table with vehicle info, earnings, tips, online toggle |
| **Users** | Full user list with role filter, block/unblock, and wallet credit/debit via `window.prompt` |
| **Courier** | Courier request cards with status filter and inline status changer |
| **Coupons** | Create/edit form (left) + coupons list (right) with delete |
| **Banners** | Create/edit form (left, with image upload) + visual banner preview list (right) |
| **Reviews** | Read-only table of all customer reviews with ratings |
| **Notifications** | Compose form (title/body/type/target) + recent notifications feed |
| **Analytics** | Summary cards + daily revenue bar chart + status breakdown + top drivers (last 30 days) |
| **Settings** | Dynamic key-value form generated from `/admin/settings` response |

---

## TypeScript Types

The app defines all its data shapes at the top of `App.tsx`:

| Type | Represents |
|------|-----------|
| `Stats` | Platform-wide count summary |
| `User` | Platform user (any role) |
| `Restaurant` | Restaurant entity with owner info |
| `Driver` | Driver profile with vehicle + earnings |
| `Order` | Food delivery order with items |
| `CourierRequest` | Package courier request |
| `Coupon` | Discount coupon definition |
| `Banner` | Promotional banner |
| `Notification` | Push notification record |
| `Review` | Customer review (restaurant + driver) |
| `Setting` | Key-value platform setting |
| `Analytics` | Aggregated analytics response |
| `AdminData` | Container holding all of the above |
| `Toast` | Temporary UI feedback message |
| `Section` | Union of sidebar section IDs |

---

## Admin-specific Backend Endpoints Used

All routes are prefixed with `/admin/` — these require an **ADMIN role JWT**.

```
GET    /admin/stats
GET    /admin/users          ?role= &search=
PATCH  /admin/users/:id      { isActive }
POST   /admin/wallet/adjust  { userId, amount, type, note }

GET    /admin/restaurants    ?status= &search=
PATCH  /admin/restaurants/:id { isOpen, isActive, deliveryFee, ... }

GET    /admin/drivers
PATCH  /admin/drivers/:id    { isOnline }

GET    /admin/orders         ?status= &search=
PATCH  /admin/orders/:id/status { status }

GET    /admin/courier        ?status=
PATCH  /admin/courier/:id    { status }

GET    /admin/coupons
POST   /admin/coupons        create
PATCH  /admin/coupons/:id    update
DELETE /admin/coupons/:id

GET    /admin/banners
POST   /admin/banners        create
PATCH  /admin/banners/:id    update
DELETE /admin/banners/:id

GET    /admin/notifications
POST   /admin/notifications  { title, body, type, all/role/userId }
DELETE /admin/notifications/:id

GET    /admin/reviews

GET    /admin/settings
PUT    /admin/settings       { entries: [{key, value}] }

GET    /admin/analytics      ?days=30

POST   /upload               multipart — banner image upload
```

---

## How to Run

```bash
# from the admin-web directory
cd admin-web

# install dependencies (first time only)
pnpm install       # or: npm install

# start dev server (hot reload on http://localhost:5173)
pnpm dev           # or: npm run dev

# build for production
pnpm build         # output in dist/

# preview the production build
pnpm preview
```

The backend must also be running at port 3000:
```bash
cd backend && npm run dev
```

Default seed admin credentials (set in backend seed):
- **Phone:** `+22200000000`
- **Password:** `password123`

---

## Environment Variable

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3000/api` | Backend API base URL |

Create a `.env` file in `admin-web/` to override:
```
VITE_API_URL=http://192.168.100.3:3000/api
```

---

## CSS Architecture

Styles are split into two files:

- **`src/index.css`** — global reset, body defaults, CSS custom properties
- **`src/App.css`** — all layout and component styles

Key CSS classes to know:

| Class | What it styles |
|-------|---------------|
| `.shell` | Two-column grid layout (sidebar + content) |
| `.sidebar` | Left navigation panel |
| `.content` | Right scrollable content area |
| `.topbar` | Top header with title and search |
| `.panel` | White card container with title |
| `.stat-card` | Metric card in the overview grid |
| `.stats-grid` | 3-column stat card grid |
| `.grid-two` | Two-column panel layout |
| `.entity-card` | General-purpose data card |
| `.table-wrap` | Scrollable table container |
| `.pill` | Inline badge/tag |
| `.pill.good` | Green badge (active/online) |
| `.pill.danger` | Red badge (blocked/inactive) |
| `.status-*` | Order status color badges |
| `.toast` | Bottom-right notification popup |
| `.login-page` | Centered login screen |
| `.bar-chart` | Analytics daily revenue chart |
| `.primary-btn` | Green CTA button |
| `.stack` | Vertical flex container (forms) |
| `.row` | Horizontal flex container |

---

## Brand Colors

These match the shared platform theme:

```
Primary green:      #00C47A
Primary dark green: #009960
Dark navy:          #0D1B2A
Background grey:    #F5F7F6
Error red:          #F44336
Warning orange:     #FF9800
Text:               #0D1B2A
Muted text:         #6B7280
Border:             #E5E7EB
Banner orange:      #E8441A  (default banner background)
```

---

## Key Patterns to Know

### 1. Filtered re-fetch on filter change
Changing `roleFilter`, `orderFilter`, or `courierFilter` automatically re-runs `loadData()` because `loadData` is a `useCallback` that lists those as dependencies, and a `useEffect` watches it.

### 2. Optimistic feedback
Every mutation calls `notify('success', ...)` immediately after the API responds, then calls `loadData()` to pull fresh data. There's no local optimistic update.

### 3. Inline editing via draft state
Coupons and Banners use a "draft" pattern: clicking "Edit" on a row copies the row data into `couponDraft`/`bannerDraft`, which pre-fills the form. Saving submits a `PATCH` if an `id` is present, `POST` if not.

### 4. Image upload for banners
Clicking "Upload image" sends a `multipart/form-data` `POST` to `/upload`, gets back a URL, and stores it in `bannerDraft.image`.

### 5. Wallet adjustment uses `window.prompt`
User wallet credit/debit uses the browser's native `window.prompt()` dialog for the amount input — no modal component.

---

## What is NOT built yet

This dashboard is largely complete. Things that may need attention:

- No pagination on any table (all data loaded at once)
- No real-time updates (Socket.IO not connected here)
- No mobile-responsive layout (designed for desktop only)
- No chart library — the revenue bar chart is pure CSS `<div>` bars
- Order detail modal (items, addresses) not implemented
- User detail/history drawer not implemented
