import { useState } from 'react'
import {
  DEFAULT_BOOT,
  MAX_PLAYERS,
  MIN_PLAYERS,
  validateSetup,
} from '../utils/gameLogic'

const EXAMPLE_NAMES = ['Vishal', 'Rahul', 'Aman', 'Rohit', 'Karan', 'Neha', 'Priya', 'Sahil']

let nextRowId = 1
function newRow() {
  return { id: nextRowId++, name: '' }
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30'

export default function SetupPage({ onStart, onJoin, showToast }) {
  const [rows, setRows] = useState(() => [newRow(), newRow(), newRow(), newRow()])
  const [boot, setBoot] = useState(String(DEFAULT_BOOT))

  function addPlayer() {
    if (rows.length >= MAX_PLAYERS) {
      showToast(`Maximum ${MAX_PLAYERS} players allowed`)
      return
    }
    setRows([...rows, newRow()])
  }

  function removePlayer(id) {
    if (rows.length <= MIN_PLAYERS) {
      showToast(`You need at least ${MIN_PLAYERS} players`)
      return
    }
    setRows(rows.filter((row) => row.id !== id))
  }

  function updateName(id, value) {
    setRows(rows.map((row) => (row.id === id ? { ...row, name: value } : row)))
  }

  function handleStart() {
    const result = validateSetup(rows, boot)
    if (!result.ok) {
      showToast(result.message)
      return
    }
    onStart(result.players, result.boot)
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-3 py-6 sm:px-4 sm:py-10 sm:py-16">
      <div className="pointer-events-none absolute -top-40 -left-40 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl sm:h-96 sm:w-96" />

      <div className="relative mx-auto max-w-2xl">
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl sm:text-5xl">
            Teen Patti Tracker
          </h1>
          <p className="mt-2 text-base font-medium text-gray-300 sm:text-lg">
            Real cards. Digital tracking.
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs text-gray-400 sm:text-sm">
            Everyone starts at ₹0. Money paid in goes negative, winnings bring it
            back up, so you always see who is in profit or loss.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:p-5 sm:p-8">
          {/* Boot amount */}
          <div className="mb-5 rounded-xl border border-brand-amber/30 bg-brand-amber/10 p-3 sm:mb-6 sm:p-4">
            <label className="text-sm font-semibold text-brand-amber" htmlFor="boot">
              Boot amount
            </label>
            <p className="mb-2 text-xs text-gray-400">
              Every player pays this into the pot at the start of every round.
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                ₹
              </span>
              <input
                id="boot"
                type="number"
                inputMode="numeric"
                min="1"
                value={boot}
                onChange={(e) => setBoot(e.target.value)}
                className={`${inputClass} pl-8 py-2.5 sm:py-3`}
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between sm:mb-5">
            <h2 className="text-base font-semibold text-white sm:text-lg">Players</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-300">
              {rows.length} / {MAX_PLAYERS}
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {rows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-[1.75rem_1fr_2.25rem] items-center gap-2 sm:grid-cols-[2rem_1fr_2.5rem] sm:gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
                  {index + 1}
                </div>

                <input
                  type="text"
                  value={row.name}
                  maxLength={20}
                  placeholder={`e.g. ${EXAMPLE_NAMES[index]}`}
                  onChange={(e) => updateName(row.id, e.target.value)}
                  className={`${inputClass} py-2.5 sm:py-3`}
                />

                <button
                  onClick={() => removePlayer(row.id)}
                  aria-label={`Remove player ${index + 1}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-brand-red/20 hover:text-brand-red active:scale-90 sm:h-10 sm:w-10"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addPlayer}
            className="mt-4 w-full rounded-xl border border-dashed border-white/20 py-2.5 font-medium text-gray-300 transition hover:border-brand-blue hover:bg-brand-blue/10 hover:text-white active:scale-[0.98] sm:mt-5 sm:py-3"
          >
            + Add player
          </button>

          <button
            onClick={handleStart}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-3 text-base font-bold text-white shadow-lg shadow-brand-blue/20 transition hover:scale-[1.02] hover:shadow-brand-purple/30 active:scale-95 sm:mt-4 sm:py-4 sm:text-lg"
          >
            Start Game
          </button>
                    <button
            onClick={onJoin}
            className="mt-2.5 w-full rounded-xl border border-white/15 py-2.5 font-medium text-gray-300 transition hover:bg-white/10 active:scale-[0.98] sm:mt-3 sm:py-3"
          >
            📱 Join a friend's game with a room code
          </button>
        </section>

        <p className="mt-5 text-center text-xs text-gray-500 sm:mt-6">
          This app never deals or shuffles cards. Use a real deck.
        </p>
      </div>
    </div>
  )
}