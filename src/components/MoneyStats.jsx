import { formatSigned } from '../utils/gameLogic'

function color(n) {
  if (n > 0) return 'text-brand-green'
  if (n < 0) return 'text-brand-red'
  return 'text-gray-300'
}

// winner is game.lastWinner ({ name, amount }) or null
export default function MoneyStats({ players, winner }) {
  const rows = players
    .map((p) => {
      const won = winner && winner.name === p.name ? winner.amount : 0
      return { ...p, roundNet: winner ? won - p.roundPaid : null }
    })
    .sort((a, b) => b.money - a.money)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md">
      <h2 className="mb-4 text-lg font-bold text-white">
        💰 Money stats {winner ? '· round result' : ''}
      </h2>

      <div className="mb-2 grid grid-cols-[1fr_5rem_6rem] gap-2 px-3 text-xs uppercase tracking-wide text-gray-500">
        <span>Player</span>
        <span className="text-right">{winner ? 'Round' : 'Paid'}</span>
        <span className="text-right">Balance</span>
      </div>

      <ul className="space-y-2">
        {rows.map((p, i) => (
          <li
            key={p.id}
            className="grid grid-cols-[1fr_5rem_6rem] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
          >
            <span className="truncate font-semibold text-white">
              {i === 0 && p.money > 0 ? '👑 ' : ''}
              {p.name}
            </span>
            {winner ? (
              <span className={`text-right font-bold ${color(p.roundNet)}`}>
                {formatSigned(p.roundNet)}
              </span>
            ) : (
              <span className="text-right text-gray-300">₹{p.roundPaid}</span>
            )}
            <span className={`text-right text-lg font-extrabold ${color(p.money)}`}>
              {formatSigned(p.money)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}