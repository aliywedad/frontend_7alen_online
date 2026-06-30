const VARIANT_CLASSES: Record<string, string> = {
  'badge-success': 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'badge-danger':  'bg-red-100 text-red-700 ring-1 ring-red-200',
  'badge-warning': 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'badge-info':    'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
  'badge-neutral': 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
}

const STATUS_VARIANT: Record<string, string> = {
  PENDING:          'badge-warning',
  ACCEPTED:         'badge-warning',
  PREPARING:        'badge-warning',
  READY_FOR_PICKUP: 'badge-warning',
  ASSIGNED:         'badge-warning',
  PICKED_UP:        'badge-info',
  DELIVERED:        'badge-success',
  CANCELLED:        'badge-danger',
  ACTIVE:           'badge-success',
  INACTIVE:         'badge-danger',
  ONLINE:           'badge-success',
  OFFLINE:          'badge-neutral',
  BLOCKED:          'badge-danger',
}

export function Badge({ label, variant }: { label: string; variant?: string }) {
  const key = variant ?? STATUS_VARIANT[label.toUpperCase().replace(/ /g, '_')] ?? 'badge-neutral'
  const cls = VARIANT_CLASSES[key] ?? VARIANT_CLASSES['badge-neutral']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export function BoolBadge({
  value,
  trueLabel = 'Active',
  falseLabel = 'Inactive',
}: {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}) {
  return (
    <Badge
      label={value ? trueLabel : falseLabel}
      variant={value ? 'badge-success' : 'badge-danger'}
    />
  )
}
