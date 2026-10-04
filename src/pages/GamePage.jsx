import { useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import GameStats from '../components/GameStats'
import PlayerList from '../components/PlayerList'
import TurnPanel from '../components/TurnPanel'
import RoundHistory from '../components/RoundHistory'
import WinnerPicker from '../components/WinnerPicker'
import WinnerBanner from '../components/WinnerBanner'
import MoneyStats from '../components/MoneyStats'
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
  canAct,
  chip,
  backLabel,
  showPicker,
  onBack,
  onAction,
  onOpenPicker, // host only
  onClosePicker, // host only
  onSelectWinner, // host only
  onNextRound, // host only
}) {
  const acting = canAct && !game.lastWinner
  const resultsRef = useRef(null)

  // When a winner is declared, scroll down to the stats and the next-round button
  useEffect(() => {
    if (game.lastWinner && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [game.lastWinner])

  return (
    <div>
      <Navbar onBack={onBack} backLabel={backLabel} chip={chip} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {game.lastWinner && <WinnerBanner winner={game.lastWinner} />}

        <GameStats
          round={game.round}
          pot={game.pot}
          currentChaal={getChaalAmount(game)}
          playersIn={getActivePlayers(game.players).length}
        />

        <div className="grid gap-6 lg:grid-cols-3">
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
                onDeclare={game.lastWinner ? undefined : onOpenPicker}
              />
            </div>
          </div>
        </div>

        {/* Money stats: after a round ends it shows each player's result */}
        <div ref={resultsRef} className="scroll-mt-20">
          <MoneyStats players={game.players} winner={game.lastWinner} />
        </div>

        <RoundHistory history={game.history} />

        {/* Very last thing on the page */}
        {game.lastWinner &&
          (onNextRound ? (
            <button
              onClick={onNextRound}
              className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
            >
              Start Next Round
            </button>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 py-4 text-center text-sm text-gray-400">
              Waiting for the host to start the next round…
            </p>
          ))}
      </main>

      {showPicker && (
        <WinnerPicker
          players={game.players}
          pot={game.pot}
          onSelect={onSelectWinner}
          onClose={onClosePicker}
        />
      )}
    </div>
  )
}