import PlayerCard from './PlayerCard'

// One column on phones, two on tablets and up
export default function PlayerList({ players, currentTurn }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {players.map((player, index) => (
        <PlayerCard key={player.id} player={player} isCurrent={index === currentTurn} />
      ))}
    </div>
  )
}