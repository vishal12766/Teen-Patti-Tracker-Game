// ============================================================
// gameLogic.js
// Pure functions only: no React, no localStorage, no UI.
// ============================================================

// ----- Easy-to-change settings -----
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const DEFAULT_MONEY = 1000;
export const DEFAULT_BOOT = 20; // pre-filled boot on the setup page (users can change it)
export const MAX_DOUBLINGS = 5; // the chaal can be doubled this many times per round
export const MAX_BLINDS = 3; // blind bets one player can make per round

// Shows a balance with a sign: +₹120, −₹80, or ₹0
export function formatSigned(amount) {
  if (amount > 0) return `+₹${amount}`;
  if (amount < 0) return `−₹${Math.abs(amount)}`;
  return "₹0";
}

// The chaal at the start of every round is 2x the boot (so blind = boot)
export function getStartingChaal(boot) {
  return boot * 2;
}

// ============================================================
// RAISE LOGIC (doubling the chaal)
// ============================================================

// What the current player must pay to raise:
// - BLIND player: the current chaal (2x the blind stake)
// - SEEN player: double the current chaal
export function getRaiseAmount(game) {
  const player = getCurrentPlayer(game);
  if (!player) return 0;
  // Opening bet: raising costs the current chaal for everyone
  if (game.opening) return game.currentChaal;
  return player.status === STATUS.SEEN
    ? game.currentChaal * 2
    : game.currentChaal;
}

// The chaal after the current player raises.
// Opening bet + SEEN player: the visible chaal is already half of currentChaal,
// so doubling it just reaches currentChaal. Every other case doubles currentChaal.
export function getNewChaal(game) {
  const player = getCurrentPlayer(game);
  if (game.opening && player?.status === STATUS.SEEN) return game.currentChaal;
  return game.currentChaal * 2;
}

// The current player raises: they pay, and the chaal doubles.
// Returns { ok: true, game } or { ok: false, message }.
// (The turn is moved by App, same as for Blind and Chaal.)
export function raiseChaal(game) {
  const newChaal = getNewChaal(game);
  const maxChaal = getStartingChaal(game.boot) * 2 ** MAX_DOUBLINGS;
  if (newChaal > maxChaal) {
    return { ok: false, message: `Chaal cannot go above ₹${maxChaal}` };
  }

  // Reuse payBet: it checks "not enough money" and updates the pot
  const result = payBet(game, getRaiseAmount(game));
  if (!result.ok) return result;

  return {
    ok: true,
    game: { ...result.game, currentChaal: newChaal, opening: false },
  };
}

// ----- Player statuses -----
export const STATUS = {
  BLIND: "BLIND",
  SEEN: "SEEN",
  PACKED: "PACKED",
};

// ============================================================
// WINNER / NEW ROUND LOGIC (Step 7)
// ============================================================

// Gives the whole pot to the chosen player and records the round.
// Returns { ok: true, game } or { ok: false, message }.
export function declareWinner(game, winnerId) {
  if (game.pot <= 0) {
    return { ok: false, message: "Pot is ₹0. Nobody has paid yet" };
  }

  const winner = game.players.find((p) => p.id === winnerId);
  if (!winner) {
    return { ok: false, message: "Player not found" };
  }
  if (winner.status === STATUS.PACKED) {
    return { ok: false, message: `${winner.name} has packed and cannot win` };
  }

  const prize = game.pot;
  const paidWinner = addMoney(winner, prize);

  return {
    ok: true,
    game: {
      ...game,
      pot: 0,
      players: game.players.map((p) => (p.id === winnerId ? paidWinner : p)),
      history: [
        ...game.history,
        { round: game.round, winnerName: winner.name, pot: prize },
      ],
      lastWinner: { name: winner.name, amount: prize }, // makes the modal appear
    },
  };
}

// Everyone pays the boot. Balances can go negative, so nobody sits out.
// (Still returns sittingOut so App.jsx keeps working.)
export function collectBoot(players, boot) {
  const updated = players.map((p) => ({
    ...p,
    money: p.money - boot,
    status: STATUS.BLIND,
    roundPaid: boot,
    blindCount: 0, // new round: blind count starts again
    totalPaid: p.totalPaid + boot,
  }));

  return { players: updated, pot: boot * players.length, sittingOut: [] };
}

// Resets for the next round, collects the boot, keeps every balance.
export function startNewRound(game) {
  const collected = collectBoot(game.players, game.boot);

  return {
    ok: true,
    sittingOut: [],
    game: {
      ...game,
      round: game.round + 1,
      pot: collected.pot,
      opening: true,
      currentChaal: getStartingChaal(game.boot),
      currentTurn: 0,
      lastWinner: null,
      players: collected.players,
    },
  };
}

// ============================================================
// BLIND / SEEN / PACK LOGIC (Step 6)
// ============================================================

// Replaces one player in the list with an updated copy. Returns a new players array.
function updatePlayer(players, playerId, changes) {
  return players.map((p) => (p.id === playerId ? { ...p, ...changes } : p));
}

// The current player looks at their cards: BLIND -> SEEN.
// Returns { ok: true, game } or { ok: false, message }.
export function markSeen(game) {
  const player = getCurrentPlayer(game);

  if (!player || player.status === STATUS.PACKED) {
    return { ok: false, message: "No active player" };
  }
  if (player.status === STATUS.SEEN) {
    return { ok: false, message: `${player.name} is already seen` };
  }

  return {
    ok: true,
    game: {
      ...game,
      players: updatePlayer(game.players, player.id, { status: STATUS.SEEN }),
    },
  };
}

// The current player packs: status becomes PACKED and the turn moves on.
// The player stays in the list and keeps their money.
// Returns { ok: true, game, remaining } where `remaining` is how many players are still active,
// or { ok: false, message }.
export function packPlayer(game) {
  const player = getCurrentPlayer(game);

  if (!player || player.status === STATUS.PACKED) {
    return { ok: false, message: "No active player" };
  }

  // The last active player cannot pack: they should be declared the winner (Step 7)
  if (getActivePlayers(game.players).length <= 1) {
    return {
      ok: false,
      message: "Only one player is left. Declare the winner instead",
    };
  }

  const packedGame = {
    ...game,
    players: updatePlayer(game.players, player.id, { status: STATUS.PACKED }),
  };

  // Move the turn. nextTurn skips packed players automatically.
  const finalGame = nextTurn(packedGame);

  return {
    ok: true,
    game: finalGame,
    remaining: getActivePlayers(finalGame.players).length,
  };
}

// ============================================================
// TURN LOGIC (Step 5)
// ============================================================

// Finds the index of the next player who is not packed.
// Starts looking AFTER `startIndex` and wraps around the table.
// Returns -1 if nobody is active.
//
// Example: players = [Vishal, Rahul(PACKED), Aman, Rohit], startIndex = 0
//   checks index 1 (packed, skip) -> index 2 (Aman, active) -> returns 2
export function findNextActiveIndex(players, startIndex) {
  const count = players.length;
  for (let step = 1; step <= count; step++) {
    const index = (startIndex + step) % count;
    if (players[index].status !== STATUS.PACKED) {
      return index;
    }
  }
  return -1; // everyone is packed
}

// Moves the turn to the next active player. Returns a new game object.
// If nobody is active, the game is returned unchanged.
export function nextTurn(game) {
  const index = findNextActiveIndex(game.players, game.currentTurn);
  if (index === -1) return game;
  return { ...game, currentTurn: index };
}

// ============================================================
// MONEY LOGIC (Step 4)
// Every function returns NEW objects instead of changing the old ones.
// That is how React notices something changed.
// ============================================================

// Gives money to a player. Returns a new player object.
export function addMoney(player, amount) {
  if (!Number.isInteger(amount) || amount <= 0) return player; // ignore bad amounts
  return { ...player, money: player.money + amount };
}

// Takes money from a player. The balance is allowed to go negative (loss).
export function deductMoney(player, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, message: "Invalid amount" };
  }
  return { ok: true, player: { ...player, money: player.money - amount } };
}

// The current player pays `amount` into the pot.
// Used for both Blind and Chaal.
// Returns { ok: true, game } with the updated game, or { ok: false, message }.
export function payBet(game, amount) {
  const player = getCurrentPlayer(game);

  if (!player || player.status === STATUS.PACKED) {
    return { ok: false, message: "No active player to pay" };
  }

  // A BLIND player's bet is always a blind bet (Blind or Double Blind).
  // `|| 0` keeps old saved games working.
  const blindsUsed = player.blindCount || 0;
  const isBlindBet = player.status === STATUS.BLIND;

  if (isBlindBet && blindsUsed >= MAX_BLINDS) {
    return {
      ok: false,
      message: `${player.name} has played ${MAX_BLINDS} blinds. Press Seen or Pack`,
    };
  }

  const result = deductMoney(player, amount);
  if (!result.ok) return result;

  const paidPlayer = {
    ...result.player,
    roundPaid: player.roundPaid + amount,
    totalPaid: player.totalPaid + amount,
    blindCount: isBlindBet ? blindsUsed + 1 : blindsUsed,
  };

  return {
    ok: true,
    game: {
      ...game,
      opening: game.opening && !isBlindBet, // only a blind bet ends the opening
      pot: game.pot + amount,
      players: game.players.map((p) => (p.id === player.id ? paidPlayer : p)),
    },
  };
}

// ----- Read-only helpers used by the dashboard -----

// Players who can still act (not packed)
export function getActivePlayers(players) {
  return players.filter((p) => p.status !== STATUS.PACKED);
}

// Money everyone still holds plus the pot.
// This number stays the same all game, because money only moves between players and the pot.
export function getTableMoney(game) {
  const inHands = game.players.reduce((sum, p) => sum + p.money, 0);
  return inHands + game.pot;
}

// A Blind bet is half of the current chaal (change this rule if your group plays differently)
export function getBlindAmount(game) {
  const chaal = Number(game.currentChaal);
  if (!Number.isFinite(chaal)) return 0;
  return Math.max(1, Math.round(chaal / 2));
}

// What a SEEN player pays for a Chaal.
// First bet of the round: same as the blind. After that: double the blind.
export function getChaalAmount(game) {
  return game.opening ? getBlindAmount(game) : game.currentChaal;
}

// The player whose turn it is (or undefined if nobody)
export function getCurrentPlayer(game) {
  return game.players[game.currentTurn];
}

// Creates one player object for the game.
export function createPlayer(name, money) {
  return {
    id: Date.now() + Math.random(), // unique enough for a local game
    name,
    money, // money the player has left
    status: STATUS.BLIND, // everyone starts blind
    roundPaid: 0, // paid in the current round
    totalPaid: 0, // paid across the whole game
    blindCount: 0, // blind bets made this round
  };
}

// Creates the full game state when the user presses "Start Game".
export function createInitialGameState(setupPlayers, boot) {
  const created = setupPlayers.map((p) => createPlayer(p.name, 0)); // everyone starts at ₹0
  const collected = collectBoot(created, boot);

  return {
    boot,
    ledger: true, // marks this save as the new profit/loss format
    opening: true,
    players: collected.players,
    pot: collected.pot,
    currentChaal: getStartingChaal(boot),
    currentTurn: 0,
    round: 1,
    history: [],
    lastWinner: null,
  };
}

// Checks the setup form. `rows` look like: [{ name: 'Vishal', money: '1000' }, ...]
// `bootInput` is the text from the boot box, e.g. '50'.
// Returns { ok: false, message } on the first problem found,
// or { ok: true, players, boot } with cleaned data.
export function validateSetup(rows, bootInput) {
  const boot = Number(bootInput);
  if (
    bootInput === "" ||
    Number.isNaN(boot) ||
    !Number.isInteger(boot) ||
    boot <= 0
  ) {
    return { ok: false, message: "Boot must be a whole number above ₹0" };
  }

  if (rows.length < MIN_PLAYERS) {
    return { ok: false, message: `You need at least ${MIN_PLAYERS} players` };
  }
  if (rows.length > MAX_PLAYERS) {
    return { ok: false, message: `Maximum ${MAX_PLAYERS} players allowed` };
  }

  const seenNames = new Set();
  const players = [];

  for (let i = 0; i < rows.length; i++) {
    const name = rows[i].name.trim();

    if (name === "") {
      return { ok: false, message: `Player ${i + 1} needs a name` };
    }

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      return { ok: false, message: `Duplicate name: "${name}"` };
    }
    seenNames.add(key);

    players.push({ name });
  }

  return { ok: true, players, boot };
}





// ============================================================
// ACTIONS (same code for local taps and taps from other phones)
// ============================================================

// action is one of: 'blind', 'chaal', 'raise', 'seen', 'pack'
// Returns { ok: true, game, ... } or { ok: false, message }
export function applyAction(game, action) {
  const player = getCurrentPlayer(game)
  if (!player || player.status === STATUS.PACKED) {
    return { ok: false, message: 'No active player' }
  }

  if (action === 'blind') {
    if (player.status !== STATUS.BLIND) {
      return { ok: false, message: 'Seen players cannot play blind' }
    }
    const result = payBet(game, getBlindAmount(game))
    return result.ok ? { ok: true, game: nextTurn(result.game) } : result
  }

  if (action === 'chaal') {
    if (player.status !== STATUS.SEEN) {
      return { ok: false, message: 'Press Seen before playing chaal' }
    }
    const result = payBet(game, getChaalAmount(game))
    return result.ok ? { ok: true, game: nextTurn(result.game) } : result
  }

  if (action === 'raise') {
    const result = raiseChaal(game)
    return result.ok ? { ok: true, game: nextTurn(result.game) } : result
  }

  if (action === 'seen') return markSeen(game)
    if (action === 'pack') {
    const result = packPlayer(game)
    if (!result.ok) return result

    // Only one player left: they win the pot automatically
    if (result.remaining === 1) {
      const last = getActivePlayers(result.game.players)[0]
      const won = declareWinner(result.game, last.id)
      if (won.ok) {
        return { ok: true, game: won.game, remaining: 1, autoWinner: true }
      }
    }
    return result
  }

  return { ok: false, message: 'Unknown action' }
}
