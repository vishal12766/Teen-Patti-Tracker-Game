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
const PEER_KEY = 'peerjs' // free public PeerJS Cloud broker key
const PEER_HOST = '0.peerjs.com'
const PEER_PORT = 443
const PEER_PATH = '/'

function makeCode() {
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

function normalizeCode(raw) {
  if (!raw) return ''
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, '') // strip anything that isn't a valid code char
}

// PeerJS options shared by host + guest so they use the SAME broker.
// If we omit these, PeerJS uses its own defaults which can drift
// between versions and cause "peer-unavailable" on different networks.
function peerOptions(id) {
  return {
    debug: 0,
    host: PEER_HOST,
    port: PEER_PORT,
    path: PEER_PATH,
    key: PEER_KEY,
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    },
    ...(id ? { id } : {}),
  }
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
  const [errorMsg, setErrorMsg] = useState('')

  const gameRef = useRef(game)
  const seatsRef = useRef({})
  const connsRef = useRef(new Map()) // peerId -> connection
  const onActionRef = useRef(onAction)
  const peerRef = useRef(null)
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
    let startAttempts = 0

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
      const next = {}
      for (const [playerId, peerId] of Object.entries(seatsRef.current)) {
        if (peerId !== conn.peer) next[playerId] = peerId
      }
      updateSeats(next)
    }

    function handleMessage(conn, msg) {
      const current = gameRef.current
      if (!msg || typeof msg !== 'object' || !current) return

      if (msg.type === 'ping') {
        if (conn.open) conn.send({ type: 'pong' })
        return
      }

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
      startAttempts += 1
      if (startAttempts > 10) {
        setStatus('error')
        setErrorMsg('Could not create room. Try again on Wi-Fi.')
        return
      }
      const newCode = makeCode()
      setStatus('starting')
      setErrorMsg('')

      let peer
      try {
        peer = new Peer(PREFIX + newCode, peerOptions(PREFIX + newCode))
      } catch (e) {
        setTimeout(start, 400 * startAttempts)
        return
      }
      peerRef.current = peer

      peer.on('open', () => {
        if (destroyed) return
        setCode(newCode)
        setStatus('online')
        setErrorMsg('')
      })
      peer.on('error', (err) => {
        if (destroyed) return
        if (err && err.type === 'unavailable-id') {
          try { peer.destroy() } catch (_) {}
          setTimeout(start, 200)
          return
        }
        if (err && (err.type === 'network' || err.type === 'disconnected' || err.type === 'socket-error' || err.type === 'server-error' || err.type === 'ssl-unavailable')) {
          try { peer.destroy() } catch (_) {}
          setTimeout(start, 600 * startAttempts)
          return
        }
        setStatus('error')
        setErrorMsg(err?.message || 'Room error')
      })
      peer.on('disconnected', () => {
        if (!destroyed) {
          try { peer.reconnect() } catch (_) {}
        }
      })
      peer.on('connection', handleConnection)
    }

    start()

    return () => {
      destroyed = true
      const peer = peerRef.current
      if (peer) {
        try { peer.destroy() } catch (_) {}
      }
      peerRef.current = null
      connsRef.current.clear()
      seatsRef.current = {}
      setSeats({})
      setCode('')
      setErrorMsg('')
      setStatus('off')
    }
  }, [enabled, broadcast])

  // Every time the game changes, push it to all phones
  useEffect(() => {
    if (enabled) broadcast()
  }, [game, enabled, broadcast])

  return { code, status, seats, errorMsg }
}

// ------------------------------------------------------------
// GUEST
// ------------------------------------------------------------
export function useGuest() {
  const [status, setStatus] = useState('idle') // idle | connecting | connected | error
  const [game, setGame] = useState(null)
  const [seats, setSeats] = useState({})
  const [myPlayerId, setMyPlayerId] = useState(null)
  const [notice, setNotice] = useState(null) // { id, message, type } shown as a toast
  const [errorMsg, setErrorMsg] = useState('')

  const peerRef = useRef(null)
  const connRef = useRef(null)
  const timerRef = useRef(null)
  const joiningRef = useRef(false)

  const say = useCallback((message, type = 'error') => {
    setNotice({ id: Date.now() + Math.random(), message, type })
  }, [])

  const leave = useCallback(() => {
    clearTimeout(timerRef.current)
    joiningRef.current = false
    const conn = connRef.current
    const peer = peerRef.current
    connRef.current = null
    peerRef.current = null
    if (conn) { try { conn.close() } catch (_) {} }
    if (peer) { try { peer.destroy() } catch (_) {} }
    setStatus('idle')
    setGame(null)
    setSeats({})
    setMyPlayerId(null)
    setErrorMsg('')
  }, [])

  const join = useCallback(
    (rawCode) => {
      const code = normalizeCode(rawCode)
      if (code.length !== 5) {
        say('Room code is 5 letters/numbers')
        return
      }
      leave()
      setStatus('connecting')
      setErrorMsg('')
      joiningRef.current = true

      let peer
      try {
        peer = new Peer(peerOptions())
      } catch (e) {
        say('Could not start connection. Try again.')
        leave()
        return
      }
      peerRef.current = peer

      timerRef.current = setTimeout(() => {
        if (!joiningRef.current) return
        setErrorMsg('Timed out. Host might be offline or on a different network.')
        say('Could not connect. Check the code and internet.')
        leave()
      }, 15000)

      let connectedConn = false
      let attempts = 0

      function tryConnect() {
        attempts += 1
        if (!joiningRef.current || !peerRef.current || peerRef.current !== peer) return
        if (attempts > 3) {
          setErrorMsg('Cannot reach host. Confirm the 5-letter code and that both phones have internet.')
          say('Room not reachable. Try again.')
          leave()
          return
        }

        const conn = peer.connect(PREFIX + code, { serialization: 'json', reliable: true })
        connRef.current = conn

        conn.on('open', () => {
          if (!joiningRef.current) return
          connectedConn = true
          clearTimeout(timerRef.current)
          setStatus('connected')
          setErrorMsg('')
          try { conn.send({ type: 'ping' }) } catch (_) {}
        })
        conn.on('data', (msg) => {
          if (!msg) return
          if (msg.type === 'state') {
            setGame(msg.game)
            setSeats(msg.seats || {})
          } else if (msg.type === 'pong') {
            // nothing to do, connectivity confirmed
          } else if (msg.type === 'claimResult') {
            if (msg.ok) setMyPlayerId(msg.playerId)
            else say(msg.message)
          } else if (msg.type === 'toast') {
            say(msg.message, msg.kind)
          }
        })
        conn.on('close', () => {
          if (!joiningRef.current) return
          if (connectedConn) {
            say('Disconnected from the host')
            leave()
          } else {
            setTimeout(tryConnect, 700 * attempts)
          }
        })
        conn.on('error', () => {
          if (!joiningRef.current) return
          if (connectedConn) {
            say('Connection lost')
            leave()
          } else {
            setTimeout(tryConnect, 700 * attempts)
          }
        })
      }

      peer.on('open', () => {
        if (!joiningRef.current) return
        tryConnect()
      })

      peer.on('error', (err) => {
        if (peerRef.current !== peer) return
        if (!joiningRef.current) return

        if (err?.type === 'peer-unavailable') {
          setErrorMsg('No room with that code exists. Confirm the 5 letters on the host screen.')
          say('Room not found. Check the code.')
          leave()
          return
        }
        if (err?.type === 'network' || err?.type === 'disconnected' || err?.type === 'socket-error') {
          if (connectedConn) {
            say('Network interrupted')
            leave()
          } else {
            // transient signaling errors: retry a few times before giving up
            setTimeout(tryConnect, 800 * attempts)
            return
          }
        }
        setErrorMsg(err?.message || 'Connection problem')
        say(err?.type === 'ssl-unavailable' ? 'Browser blocked secure WebRTC. Try Chrome/Safari.' : 'Connection problem. Try again.')
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

  return { status, game, seats, myPlayerId, notice, errorMsg, join, claim, sendAction, leave }
}