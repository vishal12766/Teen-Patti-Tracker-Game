// ============================================================
// storage.js
// The only file that talks to localStorage.
// ============================================================

const STORAGE_KEY = 'teen-patti-tracker-game'

// Quick sanity check so a corrupted save can never crash the app.
function looksValid(data) {
  return (
    data &&
    Array.isArray(data.players) &&
    data.players.length >= 2 &&
    Array.isArray(data.history) &&
    typeof data.pot === 'number' &&
    typeof data.boot === 'number' &&
    data.ledger === true &&
    typeof data.round === 'number' &&
    typeof data.currentChaal === 'number' &&
    Number.isInteger(data.currentTurn) &&
    data.currentTurn >= 0 &&
    data.currentTurn < data.players.length
  )
}

// Returns the saved game, or null if there is none (or it is broken).
export function loadGame() {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return null
    const data = JSON.parse(text)
    return looksValid(data) ? data : null
  } catch {
    return null
  }
}

// Saves the whole game state as text (JSON).
export function saveGame(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // Storage blocked or full: ignore, the game still works without saving.
  }
}

// Deletes the saved game.
export function clearGame() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}