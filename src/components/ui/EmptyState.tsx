export function EmptyState({ label = 'No data found' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">
        ○
      </div>
      <p className="text-sm font-semibold text-gray-400">{label}</p>
    </div>
  )
}
