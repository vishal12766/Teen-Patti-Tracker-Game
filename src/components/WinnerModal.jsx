export default function WinnerModal({ winner, onNextRound }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-sm animate-modal-in rounded-3xl border border-brand-purple/40 bg-gradient-to-b from-brand-blue/20 to-brand-purple/20 p-6 text-center shadow-2xl shadow-brand-purple/20 backdrop-blur-md sm:p-8">
        <div className="animate-bounce text-5xl sm:text-6xl">🏆</div>

        <h2 className="mt-3 text-2xl font-extrabold text-white sm:mt-4 sm:text-3xl">
          {winner.name} Wins!
        </h2>
        <p className="mt-1.5 text-base text-gray-300 sm:mt-2 sm:text-lg">
          Won <span className="font-extrabold text-brand-green">₹{winner.amount}</span>
        </p>

        <button
          onClick={onNextRound}
          className="mt-6 min-h-[48px] w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-3 text-base font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95 sm:mt-8 sm:py-4 sm:text-lg"
        >
          Start Next Round
        </button>
      </div>
    </div>
  )
}