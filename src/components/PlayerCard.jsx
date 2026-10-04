import { STATUS, MAX_BLINDS, formatSigned } from "../utils/gameLogic";

// Full class names are written out so Tailwind can detect them.
const statusStyles = {
  [STATUS.BLIND]: "border-brand-amber/40 bg-brand-amber/15 text-brand-amber",
  [STATUS.SEEN]: "border-brand-green/40 bg-brand-green/15 text-brand-green",
  [STATUS.PACKED]: "border-brand-red/40 bg-brand-red/15 text-brand-red",
};

export default function PlayerCard({ player, isCurrent }) {
  const isPacked = player.status === STATUS.PACKED;

  // Balance starts at 0: negative = loss, positive = profit
  const net = player.money;
  const netColor =
    net > 0 ? "text-brand-green" : net < 0 ? "text-brand-red" : "text-gray-300";
  const netLabel = net > 0 ? "In profit" : net < 0 ? "In loss" : "Break even";

  return (
    <div
      className={`relative rounded-2xl border p-3 backdrop-blur-md transition duration-300 sm:p-4 ${
        isCurrent
          ? "animate-turn-glow border-brand-blue bg-brand-blue/10"
          : "border-white/10 bg-white/5 hover:border-white/25"
      } ${isPacked ? "opacity-50 grayscale" : ""}`}
    >
      {/* Top row: name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-base font-bold text-white sm:text-lg">{player.name}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide sm:px-2.5 sm:text-xs ${statusStyles[player.status]}`}
        >
          {player.status}
        </span>
      </div>

      {/* Turn label: only shown for the current player */}
      {isCurrent && (
        <p className="mt-1 text-[10px] font-extrabold tracking-widest text-brand-blue sm:text-xs">
          🔥 YOUR TURN
        </p>
      )}
      
            {player.status === STATUS.BLIND && (
        <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
          Blinds: {player.blindCount || 0}/{MAX_BLINDS}
        </p>
      )}

      {/* Profit / loss */}
      <p
        key={player.money}
        className={`mt-2 origin-left animate-pop text-2xl font-extrabold sm:mt-3 sm:text-3xl ${netColor}`}
      >
        {formatSigned(net)}
      </p>
      <p className="text-[10px] text-gray-500 sm:text-xs">{netLabel}</p>

      {/* Round / total payments */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/10 pt-2.5 text-sm sm:mt-3 sm:pt-3">
        <div>
          <p className="text-[10px] text-gray-500 sm:text-xs">This round</p>
          <p className="text-sm font-semibold text-gray-200 sm:text-base">₹{player.roundPaid}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 sm:text-xs">Total paid</p>
          <p className="text-sm font-semibold text-gray-200 sm:text-base">₹{player.totalPaid}</p>
        </div>
      </div>
    </div>
  );
}
