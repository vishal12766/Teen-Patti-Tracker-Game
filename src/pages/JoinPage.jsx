import { useEffect, useState } from 'react'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-extrabold uppercase tracking-[0.4em] text-white placeholder-gray-600 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30'

export default function JoinPage({ guest, onCancel }) {
  const [code, setCode] = useState('')
  const connected = guest.status === 'connected' && guest.game

  useEffect(() => {
    // Re-enable the form if we're no longer connected (e.g. claim failed)
  }, [guest.myPlayerId])

  function updateCode(value) {
    // auto-strips non-code chars, auto uppercase, max 5
    const cleaned = String(value)
      .toUpperCase()
      .replace(/[^A-Z2-9]/g, '')
      .slice(0, 5)
    setCode(cleaned)
  }

  return (
    <div className="mx-auto max-w-md px-3 py-8 sm:px-4 sm:py-12">
      <h1 className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-center text-2xl font-extrabold text-transparent sm:text-3xl">
        Join a game
      </h1>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md sm:mt-6 sm:p-6">
        {/* Step 2: connected, choose who you are */}
        {connected ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white sm:text-lg">Who are you?</h2>
                <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">Tap your name.</p>
              </div>
              {guest.myPlayerId !== null && (
                <button
                  onClick={() => {
                    // Release the currently claimed seat so they can pick another
                    if (guest?.leave) {
                      // Just clear myPlayerId locally without destroying the peer
                      // by sending a fake "leave" - simplest: claim a new one will replace
                      // Re-connect is safest: reset by rejoining with same code
                      const sameCode = code
                      guest.leave()
                      setTimeout(() => guest.join(sameCode), 80)
                    }
                  }}
                  className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-white/10 active:scale-95"
                >
                  Change player
                </button>
              )}
            </div>
            {guest.myPlayerId === null && (
              <p className="mb-3 rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-3 py-2 text-xs font-semibold text-blue-200 sm:text-sm">
                Pick your seat to start playing. Each seat can only be held by one phone.
              </p>
            )}
            <div className="space-y-2">
              {guest.game.players.map((p) => {
                const taken = Boolean(guest.seats[String(p.id)])
                const mine = String(guest.myPlayerId) === String(p.id)
                return (
                  <button
                    key={p.id}
                    disabled={taken && !mine}
                    onClick={() => guest.claim(p.id)}
                    className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] sm:px-4 sm:py-4 ${
                      mine
                        ? 'border-brand-green/60 bg-brand-green/15'
                        : taken
                          ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-40'
                          : 'border-white/10 bg-white/5 hover:border-brand-blue hover:bg-brand-blue/10'
                    }`}
                  >
                    <span className="text-sm font-semibold text-white sm:text-base">
                      {mine && '✓ '}{p.name}
                    </span>
                    <span className="text-[10px] sm:text-xs ${mine ? 'text-brand-green' : 'text-gray-400'}">
                      {mine ? 'You' : taken ? 'Taken' : 'Available'}
                    </span>
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="K7M2Q"
              onChange={(e) => updateCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 5 && guest.status !== 'connecting') {
                  guest.join(code)
                }
              }}
              className={`mt-2 ${inputClass} py-2.5 text-xl sm:py-3 sm:text-2xl`}
            />

            {guest.status === 'connecting' && (
              <div className="mt-3 animate-pulse rounded-xl border border-brand-blue/40 bg-brand-blue/10 px-3 py-2.5 text-xs font-semibold text-blue-200 sm:text-sm">
                ⏳ Connecting…
              </div>
            )}
            {guest.errorMsg && guest.status === 'error' && (
              <div className="mt-3 rounded-xl border border-brand-red/40 bg-brand-red/10 px-3 py-2.5 text-xs font-semibold text-red-200 sm:text-sm">
                ⚠️ {guest.errorMsg}
              </div>
            )}
            {guest.errorMsg && guest.status === 'idle' && guest.notice === null && (
              <div className="mt-3 rounded-xl border border-brand-red/40 bg-brand-red/10 px-3 py-2.5 text-xs font-semibold text-red-200 sm:text-sm">
                ⚠️ {guest.errorMsg}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 sm:mt-3 sm:text-xs">
              <span>{code.length} / 5</span>
              <span>Letters A-Z, numbers 2-9 only</span>
            </div>

            <button
              onClick={() => guest.join(code)}
              disabled={guest.status === 'connecting' || code.length !== 5}
              className="mt-3 min-h-[48px] w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-3 text-base font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 sm:mt-4 sm:py-4 sm:text-lg"
            >
              {guest.status === 'connecting' ? 'Connecting…' : `Join${code.length ? ' · ' + code : ''}`}
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