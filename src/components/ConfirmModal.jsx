export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-modal-in rounded-2xl border border-white/10 bg-[#0b1423] p-4 shadow-2xl sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-extrabold text-white sm:text-xl">{title}</h2>
        <p className="mt-2 text-xs text-gray-400 sm:text-sm">{message}</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
          <button
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-white/15 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 active:scale-95 sm:py-3"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="min-h-[44px] rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-red/20 transition hover:scale-[1.03] active:scale-95 sm:py-3"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}