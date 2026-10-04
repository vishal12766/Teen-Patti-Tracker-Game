import { useState } from 'react'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-extrabold uppercase tracking-[0.4em] text-white placeholder-gray-600 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30'

export default function JoinPage({ guest, onCancel }) {
  const [code, setCode] = useState('')
  const connected = guest.status === 'connected' && guest.game

  return (
    <div className="mx-auto max-w-md px-3 py-8 sm:px-4 sm:py-12">
      <h1 className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-center text-2xl font-extrabold text-transparent sm:text-3xl">
        Join a game
      </h1>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:mt-6 sm:p-6">
        {/* Step 2: connected, choose who you are */}
        {connected ? (
          <>
            <h2 className="text-base font-bold text-white sm:text-lg">Who are you?</h2>
            <p className="mt-1 text-xs text-gray-400 sm:text-sm">Tap your name.</p>
            <div className="mt-3 space-y-2 sm:mt-4">
              {guest.game.players.map((p) => {
                const taken = Boolean(guest.seats[String(p.id)])
                return (
                  <button
                    key={p.id}
                    disabled={taken}
                    onClick={() => guest.claim(p.id)}
                    className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-brand-blue hover:bg-brand-blue/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:py-4"
                  >
                    <span className="text-sm font-semibold text-white sm:text-base">{p.name}</span>
                    <span className="text-[10px] text-gray-400 sm:text-xs">{taken ? 'Taken' : 'Available'}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          /* Step 1: enter the room code */
          <>
            <label className="text-xs font-semibold text-gray-300 sm:text-sm" htmlFor="room">
              Room code (shown on the host's screen)
            </label>
            <input
              id="room"
              value={code}
              maxLength={5}
              placeholder="K7M2Q"
              onChange={(e) => setCode(e.target.value)}
              className={`mt-2 ${inputClass} py-2.5 text-xl sm:py-3 sm:text-2xl`}
            />
            <button
              onClick={() => guest.join(code)}
              disabled={guest.status === 'connecting'}
              className="mt-3 min-h-[48px] w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-3 text-base font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 sm:mt-4 sm:py-4 sm:text-lg"
            >
              {guest.status === 'connecting' ? 'Connecting…' : 'Join'}
            </button>
          </>
        )}

        <button
          onClick={onCancel}
          className="mt-2.5 min-h-[44px] w-full rounded-xl border border-white/15 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 sm:mt-3 sm:py-3"
        >
          Back
        </button>
      </section>
    </div>
  )
}