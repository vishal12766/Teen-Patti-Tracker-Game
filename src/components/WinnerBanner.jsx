export default function WinnerBanner({ winner }) {
  return (
    <div className="animate-modal-in rounded-2xl border border-brand-purple/40 bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 p-5 text-center shadow-xl backdrop-blur-md">
      <div className="text-4xl">🏆</div>
      <h2 className="mt-1 text-2xl font-extrabold text-white">{winner.name} Wins!</h2>
      <p className="text-gray-300">
        Won <span className="font-extrabold text-brand-green">₹{winner.amount}</span>
      </p>
    </div>
  )
}