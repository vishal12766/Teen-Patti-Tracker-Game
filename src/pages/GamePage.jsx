import Navbar from '../components/Navbar'
import GameStats from '../components/GameStats'
import PlayerList from '../components/PlayerList'
import TurnPanel from '../components/TurnPanel'
import RoundHistory from '../components/RoundHistory'
import WinnerPicker from '../components/WinnerPicker'
import WinnerModal from '../components/WinnerModal'
import {
  getActivePlayers,
  getBlindAmount,
  getChaalAmount,
  getCurrentPlayer,
  getNewChaal,
  getRaiseAmount,
} from '../utils/gameLogic'

export default function GamePage({
  game,
  canAct, // true if this phone may press the turn buttons right now
  chip, // text in the navbar (room code, or "You: name")
  backLabel,
  showPicker,
  onBack,
  onAction,
  onOpenPicker, // host only
  onClosePicker, // host only
  onSelectWinner, // host only
  onNextRound, // host only
}) {
  // While the winner popup is open nobody can bet
  const acting = canAct && !game.lastWinner

  return (
    <div>
      <Navbar onBack={onBack} backLabel={backLabel} chip={chip} />

      <main className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6">
        <GameStats
          round={game.round}
          pot={game.pot}
          currentChaal={getChaalAmount(game)}
          playersIn={getActivePlayers(game.players).length}
        />

        {/* Desktop: players 2/3 width, turn panel 1/3 on the right.
            Mobile: the turn panel comes FIRST so it is always easy to reach. */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="order-last lg:order-first lg:col-span-2">
            <PlayerList players={game.players} currentTurn={game.currentTurn} />
          </div>

          <div className="order-first lg:order-last">
            <div className="lg:sticky lg:top-20">
              <TurnPanel
                player={getCurrentPlayer(game)}
                canAct={acting}
                blindAmount={getBlindAmount(game)}
                chaalAmount={getChaalAmount(game)}
                newChaal={getNewChaal(game)}
                raiseAmount={getRaiseAmount(game)}
                activeCount={getActivePlayers(game.players).length}
                onBlind={() => onAction('blind')}
                onChaal={() => onAction('chaal')}
                onSeen={() => onAction('seen')}
                onPack={() => onAction('pack')}
                onRaise={() => onAction('raise')}
                onDeclare={onOpenPicker}
              />
            </div>
          </div>
        </div>

        <RoundHistory history={game.history} />
      </main>

      {/* Popup: choose the winner (host only) */}
      {showPicker && (
        <WinnerPicker
          players={game.players}
          pot={game.pot}
          onSelect={onSelectWinner}
          onClose={onClosePicker}
        />
      )}

      {/* Popup: shown to everyone while game.lastWinner exists */}
      {game.lastWinner && (
        <WinnerModal winner={game.lastWinner} onNextRound={onNextRound} />
      )}
    </div>
  )
}