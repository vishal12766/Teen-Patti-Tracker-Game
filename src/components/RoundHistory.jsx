// history looks like: [{ round: 1, winnerName: 'Vishal', pot: 320 }, ...]
// The array is stored oldest-first, so we reverse a COPY to show the newest first.
export default function RoundHistory({ history }) {
  const newestFirst = [...history].reverse()

  // Add up the pot of every finished round
  const totalAmount = history.reduce((sum, entry) => sum + entry.pot, 0)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md sm:p-5">
      <div className="mb-3.5 flex items-center justify-between sm:mb-4">
        <h2 className="text-base font-bold text-white sm:text-lg">Round History</h2>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-gray-300 sm:px-3 sm:text-xs">
          {history.length} {history.length === 1 ? 'round' : 'rounds'}
        </span>
      </div>

      {/* Total amount of all finished rounds */}
      <div className="mb-3.5 flex items-center justify-between rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-3 py-2.5 sm:mb-4 sm:px-4 sm:py-3">
        <p className="text-xs font-semibold text-brand-amber sm:text-sm">Total played</p>
        <p key={totalAmount} className="animate-pop text-xl font-extrabold text-brand-amber sm:text-2xl">
          ₹{totalAmount}
        </p>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 py-5 text-center text-xs text-gray-500 sm:py-6 sm:text-sm">
          No rounds finished yet. Declare a winner to see it here.
        </p>
      )}

      {/* The list scrolls if there are many rounds */}
      <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 sm:max-h-80">
        {newestFirst.map((entry) => (
          <li
            key={entry.round}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-blue sm:text-xs">
                Round {entry.round}
              </p>
              <p className="truncate text-sm font-semibold text-white sm:text-base">
                🏆 {entry.winnerName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-gray-500 sm:text-xs">Pot</p>
              <p className="text-sm font-extrabold text-brand-amber sm:text-base">₹{entry.pot}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}