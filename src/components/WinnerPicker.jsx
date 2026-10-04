import { STATUS, formatSigned } from '../utils/gameLogic'

export default function WinnerPicker({ players, pot, onSelect, onClose }) {
  const candidates = players.filter((p) => p.status !== STATUS.PACKED)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
    >
      {/* stopPropagation: clicking inside the box should not close it */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-modal-in rounded-2xl border border-white/10 bg-[#0b1423] p-4 shadow-2xl sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-extrabold text-white sm:text-xl">Who won?</h2>
        <p className="mt-1 text-xs text-gray-400 sm:text-sm">
          Pot: <span className="font-bold text-brand-amber">₹{pot}</span>
        </p>

        <div className="mt-3 space-y-2 sm:mt-4">
          {candidates.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-brand-blue hover:bg-brand-blue/10 active:scale-[0.98] sm:px-4 sm:py-3"
            >
              <span className="text-sm font-semibold text-white sm:text-base">{p.name}</span>
              <span className="text-xs text-gray-400 sm:text-sm">₹{formatSigned(p.money)}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-3.5 min-h-[44px] w-full rounded-xl border border-white/15 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 sm:mt-4 sm:py-3"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}