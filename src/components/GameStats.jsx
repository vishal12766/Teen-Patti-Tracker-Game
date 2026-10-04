// One small tile: label on top, big value below
function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-md sm:p-4">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 sm:text-xs">{label}</p>
      {/* key={value}: when the value changes, the number "pops" again */}
      <p
        key={value}
        className={`mt-1 origin-left animate-pop text-xl font-extrabold sm:text-2xl lg:text-3xl ${accent}`}
      >
        {value}
      </p>
    </div>
  )
}

export default function GameStats({ round, pot, currentChaal, playersIn  }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      <Stat label="Round" value={round} accent="text-white" />
      <Stat label="Total pot" value={`₹${pot}`} accent="text-brand-amber" />
      <Stat label="Current chaal" value={`₹${currentChaal}`} accent="text-brand-blue" />
      <Stat label="Players in" value={playersIn} accent="text-brand-green" />
    </div>
  )
}