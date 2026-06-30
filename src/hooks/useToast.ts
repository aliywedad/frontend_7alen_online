import { useState, useCallback } from 'react'

export type ToastState = { type: 'success' | 'error'; message: string } | null

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null)

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3400)
  }, [])

  return { toast, notify }
}
