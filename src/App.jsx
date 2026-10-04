import { useEffect, useRef, useState } from 'react'
import SetupPage from './pages/SetupPage'
import JoinPage from './pages/JoinPage'
import GamePage from './pages/GamePage'
import Toast from './components/Toast'
import ConfirmModal from './components/ConfirmModal'
import { clearGame, loadGame, saveGame } from './utils/storage'
import { useGuest, useHost } from './utils/multiplayer'
import {
  applyAction,
  createInitialGameState,
  declareWinner,
  getCurrentPlayer,
  startNewRound,
} from './utils/gameLogic'

export default function App() {
  // `game` is the HOST's game. A guest never has one (they receive it from the host).
  const [game, setGame] = useState(() => loadGame())
  const [toast, setToast] = useState(null)
  const [showPicker, setShowPicker] = useState(false) // "Who won?" popup
  const [showReset, setShowReset] = useState(false) // "Reset game?" popup
  const [joining, setJoining] = useState(false) // showing the Join page

  // Always holds the newest game, so messages from phones never use an old copy
  const gameRef = useRef(game)
  gameRef.current = game

  const guest = useGuest()
  const room = useHost({ enabled: game !== null, game, onAction: runAction })

  // Save the host's game automatically
  useEffect(() => {
    if (game) {
      saveGame(game)
    } else {
      clearGame()
    }
  }, [game])

  // Show messages that come from the host (errors, "not your turn", ...)
  useEffect(() => {
    if (guest.notice) showToast(guest.notice.message, guest.notice.type)
  }, [guest.notice])

  function showToast(message, type = 'error') {
    setToast({ id: Date.now(), message, type })
  }

  function handleStart(setupPlayers, boot) {
    setGame(createInitialGameState(setupPlayers, boot))
  }

  // Called after the host confirms "Reset Game". Closing the game also closes the room.
  function handleConfirmReset() {
    setShowReset(false)
    setShowPicker(false)
    setGame(null)
    showToast('Game reset', 'info')
  }

  // Runs one button press on the host's game.
  // Used for the host's own taps AND taps arriving from other phones.
  function runAction(action) {
    const current = gameRef.current
    if (!current) return { ok: false, message: 'No game running' }
    if (current.lastWinner) return { ok: false, message: 'Round is over. Wait for the next round' }

    const result = applyAction(current, action)
    if (!result.ok) return result

    gameRef.current = result.game
    setGame(result.game)
    return result
  }

  // The host pressing a button on their own phone
  function handleHostAction(action) {
    const name = getCurrentPlayer(gameRef.current)?.name
    const result = runAction(action)
    if (!result.ok) {
      showToast(result.message)
      return
    }
      if (action === 'pack') {
      if (result.autoWinner) {
        const winner = result.game.lastWinner
        showToast(`${winner.name} wins ₹${winner.amount}. Everyone else packed`, 'success')
      } else {
        showToast(`${name} packed`, 'info')
      }
    }
  }

  // "Declare Winner": refuse if the pot is empty, otherwise open the picker
  function handleOpenPicker() {
    if (!game) return
    if (game.pot <= 0) {
      showToast('Pot is ₹0. Nobody has paid yet')
      return
    }
    setShowPicker(true)
  }

  function handleSelectWinner(playerId) {
    if (!game) return
    const result = declareWinner(game, playerId)
    if (!result.ok) {
      showToast(result.message)
      return
    }
    setShowPicker(false)
    setGame(result.game)
  }

  function handleNextRound() {
    if (!game) return
    const result = startNewRound(game)
    if (!result.ok) {
      showToast(result.message)
      return
    }
    setGame(result.game)
    showToast(`Round ${result.game.round} started. Everyone paid the boot`, 'success')
  }

  function handleLeaveGuest() {
    guest.leave()
    setJoining(false)
  }

  // ----- Decide which screen to show -----
  let screen

  if (game !== null) {
    // HOST screen
    const joined = Object.keys(room.seats).length
    const chip =
      room.status === 'online'
        ? `Room ${room.code} · ${joined} joined`
        : room.status === 'error'
          ? 'Room offline'
          : 'Room: connecting…'

    screen = (
      <GamePage
        game={game}
        canAct={true}
        chip={chip}
        backLabel="Reset Game"
        showPicker={showPicker}
        onBack={() => setShowReset(true)}
        onAction={handleHostAction}
        onOpenPicker={handleOpenPicker}
        onClosePicker={() => setShowPicker(false)}
        onSelectWinner={handleSelectWinner}
        onNextRound={handleNextRound}
      />
    )
  } else if (guest.status === 'connected' && guest.game && guest.myPlayerId !== null) {
    // GUEST screen: can press buttons only on their own turn
    const me = guest.game.players.find((p) => String(p.id) === String(guest.myPlayerId))
    const turnPlayer = getCurrentPlayer(guest.game)
    const myTurn = turnPlayer && String(turnPlayer.id) === String(guest.myPlayerId)

    screen = (
      <GamePage
        game={guest.game}
        canAct={Boolean(myTurn)}
        chip={`You: ${me ? me.name : '?'}`}
        backLabel="Leave"
        showPicker={false}
        onBack={handleLeaveGuest}
        onAction={guest.sendAction}
        /* no onOpenPicker / onNextRound: those are host-only */
      />
    )
  } else if (joining) {
    screen = <JoinPage guest={guest} onCancel={handleLeaveGuest} />
  } else {
    screen = (
      <SetupPage
        onStart={handleStart}
        onJoin={() => setJoining(true)}
        showToast={showToast}
      />
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {screen}

      {/* Confirmation before wiping the game (host only) */}
      {showReset && (
        <ConfirmModal
          title="Reset game?"
          message="This deletes all players, balances and round history, and disconnects every phone. This cannot be undone."
          confirmLabel="Yes, reset"
          onConfirm={handleConfirmReset}
          onCancel={() => setShowReset(false)}
        />
      )}
    </div>
  )
}