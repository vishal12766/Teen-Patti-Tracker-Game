import { useEffect } from 'react'

// toast looks like: { id: 123, message: 'Hello', type: 'error' | 'success' | 'info' }
export default function Toast({ toast, onClose }) {
  // Hide the toast automatically after 3 seconds.
  // Depending on toast?.id means a NEW toast restarts the timer.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [toast?.id])

  if (!toast) return null

  const colors = {
    error: 'border-brand-red/50 bg-brand-red/15 text-red-200',
    success: 'border-brand-green/50 bg-brand-green/15 text-green-200',
    info: 'border-brand-blue/50 bg-brand-blue/15 text-blue-200',
  }
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-3 sm:top-4 sm:px-4">
      {/* key={toast.id} replays the entry animation for every new toast */}
      <div
        key={toast.id}
        className={`pointer-events-auto animate-toast-in flex max-w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium shadow-2xl backdrop-blur-md sm:px-4 sm:py-3 sm:text-sm ${colors[toast.type]}`}
      >
        <span className="shrink-0">{icons[toast.type]}</span>
        <span className="truncate">{toast.message}</span>
      </div>
    </div>
  )
}