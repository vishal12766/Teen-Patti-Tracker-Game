import { useState } from 'react'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30'

// onAdd(name, money) must return { ok, message }
export default function AddPlayerModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [money, setMoney] = useState('0')
  const [error, setError] = useState('')

  function handleAdd() {
    const result = onAdd(name, money)
    if (result.ok) {
      onClose()
    } else {
      setError(result.message)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-modal-in rounded-2xl border border-white/10 bg-[#0b1423] p-6 shadow-2xl"
      >
        <h2 className="text-xl font-extrabold text-white">Add a player</h2>
        <p className="mt-1 text-sm text-gray-400">
          They sit out this round and play from the next one.
        </p>

        <label className="mt-4 block text-xs uppercase tracking-wide text-gray-500">Name</label>
        <input
          type="text"
          value={name}
          maxLength={20}
          autoFocus
          placeholder="e.g. Neha"
          onChange={(e) => setName(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />

        <label className="mt-3 block text-xs uppercase tracking-wide text-gray-500">
          Starting balance
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            ₹
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={money}
            onChange={(e) => setMoney(e.target.value)}
            className={`${inputClass} pl-8`}
          />
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-300">⚠️ {error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 py-3 font-medium text-gray-300 transition hover:bg-white/10 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-3 font-bold text-white shadow-lg transition hover:scale-[1.03] active:scale-95"
          >
            Add player
          </button>
        </div>
      </div>
    </div>
  )
}