import { STATUS, MAX_BLINDS } from '../utils/gameLogic'

// Reusable big button. `color` picks the look.
function ActionButton({ label, hint, color, onClick, disabled }) {
  const colors = {
    amber: 'from-amber-500 to-orange-500 shadow-brand-amber/20',
    blue: 'from-brand-blue to-brand-purple shadow-brand-blue/20',
    green: 'from-green-500 to-emerald-600 shadow-brand-green/20',
    red: 'from-red-500 to-rose-600 shadow-brand-red/20',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] rounded-xl bg-gradient-to-r px-2 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:px-4 sm:py-3 sm:text-base ${colors[color]}`}
    >
      <div className="flex flex-col items-center justify-center leading-tight sm:flex-row sm:gap-1">
        <span>{label}</span>
        {hint && <span className="font-extrabold">{hint}</span>}
      </div>
    </button>
  )
}

export default function TurnPanel({
  player,
  canAct, // false = not this phone's turn, buttons are locked
  blindAmount,
  chaalAmount,
  newChaal,
  raiseAmount,
  activeCount,
  onBlind,
  onChaal,
  onSeen,
  onPack,
  onRaise,
  onDeclare, // only the host passes this
}) {
  if (!player) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-gray-400">
        No active players
      </div>
    )
  }

  const isSeen = player.status === STATUS.SEEN
  const lastOneLeft = activeCount === 1

  // After MAX_BLINDS blind bets, a blind player must press Seen
  const blindsLeft = MAX_BLINDS - (player.blindCount || 0)
  const blindLocked = !isSeen && blindsLeft <= 0

  // Blind players "double the blind"; seen players "raise"
  const raiseLabel = isSeen ? 'Raise' : 'Double Blind'
  const raiseNote = isSeen ? `Chaal becomes ₹${newChaal}` : `Blind becomes ₹${newChaal / 2}`

  return (
    <section className="rounded-2xl border border-brand-blue/40 bg-gradient-to-b from-brand-blue/15 to-brand-purple/10 p-4 shadow-2xl backdrop-blur-md sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:text-xs">
        Current Turn
      </p>

      <h2 className="mt-1.5 truncate text-2xl font-extrabold text-white sm:mt-2 sm:text-3xl">
        🔥 {player.name}
      </h2>
      <p className="mt-0.5 text-xs text-gray-400 sm:mt-1 sm:text-sm">
        {canAct ? 'Your action' : `Waiting for ${player.name}…`}
      </p>

      {lastOneLeft && (
        <div className="mt-3 animate-pop rounded-xl border border-brand-amber/50 bg-brand-amber/15 px-3 py-2.5 text-xs font-semibold text-brand-amber sm:mt-4 sm:px-4 sm:py-3 sm:text-sm">
          Everyone else has packed. {onDeclare ? `Declare ${player.name} as the winner!` : 'The host will declare the winner.'}
        </div>
      )}

      <p className="mt-2.5 text-center text-[11px] text-gray-400 sm:mt-3 sm:text-xs">
        {isSeen
          ? 'Seen players play Chaal or Raise'
          : blindLocked
            ? `All ${MAX_BLINDS} blinds used. Press Seen to continue`
            : `Blinds left: ${blindsLeft} of ${MAX_BLINDS}`}
      </p>

      {/* Main actions */}
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-3">
        <ActionButton
          label="Blind"
          hint={`₹${blindAmount}`}
          color="amber"
          onClick={onBlind}
          disabled={!canAct || isSeen || blindLocked}
        />
        <ActionButton
          label="Chaal"
          hint={`₹${chaalAmount}`}
          color="blue"
          onClick={onChaal}
          disabled={!canAct || !isSeen}
        />
        <ActionButton
          label="Seen"
          color="green"
          onClick={onSeen}
          disabled={!canAct || isSeen}
        />
        <ActionButton label="Pack" color="red" onClick={onPack} disabled={!canAct} />
      </div>

      {/* Double the blind / raise: the only way to increase the stake */}
      <button
        onClick={onRaise}
        disabled={!canAct || blindLocked}
        className="mt-2.5 min-h-[48px] w-full rounded-xl border border-brand-purple/50 bg-brand-purple/15 px-2 py-2.5 text-sm font-bold text-purple-200 transition hover:bg-brand-purple/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-purple/15 sm:mt-3 sm:px-4 sm:py-3"
      >
        ⬆️ {raiseLabel} <span className="font-extrabold">₹{raiseAmount}</span>
        <span className="block text-[10px] font-medium text-purple-300/70 sm:text-xs">{raiseNote}</span>
      </button>

      {/* Host only */}
      {onDeclare && (
        <button
          onClick={onDeclare}
          className={`mt-2.5 min-h-[48px] w-full rounded-xl border px-2 py-2.5 text-sm font-bold transition active:scale-95 sm:mt-3 sm:px-4 sm:py-3 ${
            lastOneLeft
              ? 'animate-turn-glow border-brand-amber bg-brand-amber/25 text-brand-amber'
              : 'border-brand-amber/50 bg-brand-amber/10 text-brand-amber hover:bg-brand-amber/20'
          }`}
        >
          🏆 Declare Winner
        </button>
      )}
    </section>
  )
}