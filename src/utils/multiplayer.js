// ============================================================
// multiplayer.js
// Phones talk directly to each other using PeerJS (WebRTC).
// The HOST phone owns the game. Guests only send button presses.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { getCurrentPlayer } from './gameLogic'

const PREFIX = 'tpt-' // keeps our room codes separate from other apps
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I mix-ups

function makeCode() {
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

// ------------------------------------------------------------
// HOST
// enabled: true while a game exists
// onAction(action) -> { ok, message }  (runs the action on the host's game)
// ------------------------------------------------------------
export function useHost({ enabled, game, onAction }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('off') // off | starting | online | error
  const [seats, setSeats] = useState({}) // { playerId: peerId } who sits where

  const gameRef = useRef(game)
  const seatsRef = useRef({})
  const connsRef = useRef(new Map()) // peerId -> connection
  const onActionRef = useRef(onAction)
  gameRef.current = game
  onActionRef.current = onAction

  // Send the latest game + seats to every connected phone
  const broadcast = useCallback(() => {
    const msg = { type: 'state', game: gameRef.current, seats: seatsRef.current }
    connsRef.current.forEach((conn) => {
      if (conn.open) conn.send(msg)
    })
  }, [])

  // Open (and close) the room
  useEffect(() => {
    if (!enabled) return
    let destroyed = false
    let peer = null

    function updateSeats(next) {
      seatsRef.current = next
      setSeats(next)
      broadcast()
    }

    function tell(conn, message, kind = 'error') {
      if (conn.open) conn.send({ type: 'toast', message, kind })
    }

    function dropConnection(conn) {
      if (connsRef.current.get(conn.peer) === conn) {
        connsRef.current.delete(conn.peer)
      }
      // free the seat this phone was holding
      const next = {}
      for (const [playerId, peerId] of Object.entries(seatsRef.current)) {
        if (peerId !== conn.peer) next[playerId] = peerId
      }
      updateSeats(next)
    }

    function handleMessage(conn, msg) {
      const current = gameRef.current
      if (!msg || typeof msg !== 'object' || !current) return

      // A phone chooses which player it is
      if (msg.type === 'claim') {
        const player = current.players.find((p) => String(p.id) === String(msg.playerId))
        if (!player) {
          conn.send({ type: 'claimResult', ok: false, message: 'Player not found' })
          return
        }
        const key = String(player.id)
        const holder = seatsRef.current[key]
        if (holder && holder !== conn.peer) {
          conn.send({ type: 'claimResult', ok: false, message: `${player.name} is already taken` })
          return
        }
        // one phone = one seat
        const next = {}
        for (const [k, v] of Object.entries(seatsRef.current)) {
          if (v !== conn.peer) next[k] = v
        }
        next[key] = conn.peer
        conn.send({ type: 'claimResult', ok: true, playerId: player.id })
        updateSeats(next)
        return
      }

      // A phone presses a button: allowed only on that player's turn
      if (msg.type === 'action') {
        const seat = Object.entries(seatsRef.current).find(([, peerId]) => peerId === conn.peer)
        if (!seat) {
          tell(conn, 'Pick your player first')
          return
        }
        const turnPlayer = getCurrentPlayer(current)
        if (!turnPlayer || String(turnPlayer.id) !== seat[0]) {
          tell(conn, 'It is not your turn')
          return
        }
        const result = onActionRef.current(msg.action)
        if (!result.ok) tell(conn, result.message)
      }
    }

    function handleConnection(conn) {
      conn.on('open', () => {
        connsRef.current.set(conn.peer, conn)
        conn.send({ type: 'state', game: gameRef.current, seats: seatsRef.current })
      })
      conn.on('data', (msg) => handleMessage(conn, msg))
      conn.on('close', () => dropConnection(conn))
      conn.on('error', () => dropConnection(conn))
    }

    function start() {
      const newCode = makeCode()
      setStatus('starting')
      peer = new Peer(PREFIX + newCode)

      peer.on('open', () => {
        if (destroyed) return
        setCode(newCode)
        setStatus('online')
      })
      peer.on('error', (err) => {
        if (destroyed) return
        if (err.type === 'unavailable-id') {
          peer.destroy()
          start() // code was taken, try another
          return
        }
        setStatus('error')
      })
      peer.on('disconnected', () => {
        if (!destroyed) peer.reconnect() // lost the helper server, existing links stay alive
      })
      peer.on('connection', handleConnection)
    }

    start()

    return () => {
      destroyed = true
      if (peer) peer.destroy()
      connsRef.current.clear()
      seatsRef.current = {}
      setSeats({})
      setCode('')
      setStatus('off')
    }
  }, [enabled, broadcast])

  // Every time the game changes, push it to all phones
  useEffect(() => {
    if (enabled) broadcast()
  }, [game, enabled, broadcast])

  return { code, status, seats }
}

// ------------------------------------------------------------
// GUEST
// ------------------------------------------------------------
export function useGuest() {
  const [status, setStatus] = useState('idle') // idle | connecting | connected
  const [game, setGame] = useState(null)
  const [seats, setSeats] = useState({})
  const [myPlayerId, setMyPlayerId] = useState(null)
  const [notice, setNotice] = useState(null) // { id, message, type } shown as a toast

  const peerRef = useRef(null)
  const connRef = useRef(null)
  const timerRef = useRef(null)

  const say = useCallback((message, type = 'error') => {
    setNotice({ id: Date.now() + Math.random(), message, type })
  }, [])

  const leave = useCallback(() => {
    clearTimeout(timerRef.current)
    const conn = connRef.current
    const peer = peerRef.current
    connRef.current = null // set first so the close handlers know we left on purpose
    peerRef.current = null
    if (conn) conn.close()
    if (peer) peer.destroy()
    setStatus('idle')
    setGame(null)
    setSeats({})
    setMyPlayerId(null)
  }, [])

  const join = useCallback(
    (rawCode) => {
      const code = rawCode.trim().toUpperCase()
      if (code.length < 4) {
        say('Enter the room code')
        return
      }
      leave()
      setStatus('connecting')

      const peer = new Peer()
      peerRef.current = peer

      timerRef.current = setTimeout(() => {
        say('Could not connect. Check the code and your internet')
        leave()
      }, 12000)

      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { serialization: 'json', reliable: true })
        connRef.current = conn

        conn.on('open', () => {
          clearTimeout(timerRef.current)
          setStatus('connected')
        })
        conn.on('data', (msg) => {
          if (!msg) return
          if (msg.type === 'state') {
            setGame(msg.game)
            setSeats(msg.seats || {})
          } else if (msg.type === 'claimResult') {
            if (msg.ok) setMyPlayerId(msg.playerId)
            else say(msg.message)
          } else if (msg.type === 'toast') {
            say(msg.message, msg.kind)
          }
        })
        conn.on('close', () => {
          if (connRef.current !== conn) return // we left on purpose
          say('Disconnected from the host')
          leave()
        })
      })

      peer.on('error', (err) => {
        if (peerRef.current !== peer) return
        say(err.type === 'peer-unavailable' ? 'Room not found. Check the code' : 'Connection problem. Try again')
        leave()
      })
    },
    [leave, say]
  )

  function claim(playerId) {
    if (connRef.current?.open) connRef.current.send({ type: 'claim', playerId })
  }

  function sendAction(action) {
    if (connRef.current?.open) connRef.current.send({ type: 'action', action })
  }

  // Close everything if the page is closed
  useEffect(() => leave, [leave])

  return { status, game, seats, myPlayerId, notice, join, claim, sendAction, leave }
}