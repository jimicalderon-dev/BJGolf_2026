import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAllScores } from '../lib/supabase'
import { HOLES, EVENTS_STATIC, ITINERARY, TOURNAMENT_CONFIG, computeScore, toParLabel, toParColor } from '../constants/course'
import Countdown from '../components/Countdown'

function computeRyderPoints(allScores, players) {
  let teamA = 0, teamB = 0
  EVENTS_STATIC.forEach(ev => {
    const evScores = allScores[ev.id] || {}
    const aPlayers = players.filter(p => p.team === 'A')
    const bPlayers = players.filter(p => p.team === 'B')
    let aTotal = 0, bTotal = 0, hasA = false, hasB = false
    aPlayers.forEach(p => {
      const s = computeScore(evScores[p.id] || {})
      if (s.holesPlayed > 0) { aTotal += s.toPar; hasA = true }
    })
    bPlayers.forEach(p => {
      const s = computeScore(evScores[p.id] || {})
      if (s.holesPlayed > 0) { bTotal += s.toPar; hasB = true }
    })
    if (hasA && hasB) {
      if (aTotal < bTotal) teamA++
      else if (bTotal < aTotal) teamB++
    }
  })
  return { teamA, teamB }
}

// ── Countdown hero ───────────────────────────────────────────────
function CountdownHero() {
  const now             = new Date()
  const tripStart       = new Date(TOURNAMENT_CONFIG.tripStart)
  const tournamentStart = new Date(TOURNAMENT_CONFIG.tournamentStart)
  const tournamentEnd   = new Date(TOURNAMENT_CONFIG.tournamentEnd)

  const tripStarted       = now >= tripStart
  const tournamentStarted = now >= tournamentStart
  const tournamentOver    = now >= tournamentEnd

  // Current event (during tournament)
  const currentEvent = TOURNAMENT_CONFIG.events.findLast?.(
    e => now >= new Date(e.start)
  ) ?? null

  // Share button
  const handleShare = () => {
    const diff   = tripStart - now
    const days   = Math.max(0, Math.floor(diff / 86_400_000))
    const text   = days > 0
      ? `BJ 2026 starts in ${days} day${days !== 1 ? 's' : ''}! ⛳🏆`
      : 'BJ 2026 is LIVE! ⛳🏆'
    navigator.clipboard?.writeText(text).catch(() => {})
    alert('Copied to clipboard: ' + text)
  }

  if (tournamentOver) {
    return (
      <div
        className="rounded-2xl p-5 text-center pulse-gold"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.4)' }}
      >
        <p className="font-serif text-3xl font-bold gold-text">🏆 TOURNAMENT COMPLETE</p>
        <p className="text-slate-400 text-sm mt-2">What a week. Check the final leaderboard!</p>
      </div>
    )
  }

  if (tournamentStarted) {
    return (
      <div
        className="rounded-2xl p-5 space-y-3 pulse-gold"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.4)' }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="live-dot w-2 h-2 rounded-full bg-red-400 inline-block" />
          <p
            className="font-serif font-bold text-xl gold-text tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.1em' }}
          >
            ⛳ TOURNAMENT IS LIVE
          </p>
          <span className="live-dot w-2 h-2 rounded-full bg-red-400 inline-block" />
        </div>
        {currentEvent && (
          <p className="text-center text-sm text-slate-300">
            Now Playing: <span className="text-yellow-400 font-semibold">{currentEvent.name}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            LIVE
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
            Trip Started
          </span>
        </div>
      </div>
    )
  }

  if (tripStarted) {
    return (
      <div
        className="rounded-2xl p-5 space-y-4 glow-green"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(74,222,128,0.4)' }}
      >
        <p className="text-center font-serif text-lg font-bold text-green-400">
          🏌️ THE TRIP HAS BEGUN! 🎉
        </p>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
          <Countdown targetDate={TOURNAMENT_CONFIG.tournamentStart} label="FIRST TEE TIME IN" />
        </div>
        <button onClick={handleShare} className="btn-outline w-full py-2 text-xs justify-center">
          📤 Share Countdown
        </button>
      </div>
    )
  }

  // Before trip — show both countdowns
  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.25)' }}
    >
      <Countdown targetDate={TOURNAMENT_CONFIG.tripStart} label="TRIP STARTS IN" />

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
        <Countdown targetDate={TOURNAMENT_CONFIG.tournamentStart} label="FIRST TEE TIME IN" />
      </div>

      <button onClick={handleShare} className="btn-outline w-full py-2 text-xs justify-center">
        📤 Share Countdown
      </button>
    </div>
  )
}

// ── Home page ────────────────────────────────────────────────────
export default function Home() {
  const { player, players } = useAuth()
  const navigate            = useNavigate()
  const [allScores, setAllScores] = useState({})

  useEffect(() => {
    fetchAllScores().then(data => setAllScores(data || {}))
  }, [])

  const ev1Scores = allScores['ind'] || {}
  const ranked = players
    .map(p => ({ ...p, ...computeScore(ev1Scores[p.id] || {}) }))
    .filter(p => p.holesPlayed > 0)
    .sort((a, b) => a.toPar - b.toPar)
  const leader = ranked[0] || null

  const { teamA, teamB } = computeRyderPoints(allScores, players)

  const coursePar     = HOLES.reduce((s, h) => s + h.par, 0)
  const courseYardage = HOLES.reduce((s, h) => s + h.yards, 0)

  const quickLinks = [
    { label: '📊 Live Scores', path: '/scores' },
    { label: '🏆 Teams',       path: '/teams' },
    { label: '📈 Stats',       path: '/stats' },
    { label: '🎯 Challenges',  path: '/challenges' },
  ]

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="font-serif text-5xl font-bold gold-text">BJ 2026</h1>
        <p className="text-slate-600 text-[10px] tracking-widest uppercase mt-2">
          Las Colinas Golf & Country Club Resort
        </p>
        {player && (
          <p className="text-slate-400 text-sm mt-3">
            Welcome back,{' '}
            <span className="text-yellow-400 font-semibold">{player.name}</span> 👋
          </p>
        )}
      </div>

      {/* Countdown hero */}
      <CountdownHero />

      {/* Ryder Cup Standings */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.2)' }}
      >
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">⚔️ Ryder Cup</p>
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-green-400 uppercase tracking-wider mb-2">Team A</p>
            <p className="font-serif text-6xl font-bold text-green-400">{teamA}</p>
          </div>
          <div className="text-slate-600 text-sm font-light tracking-widest">VS</div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">Team B</p>
            <p className="font-serif text-6xl font-bold text-blue-400">{teamB}</p>
          </div>
        </div>
      </div>

      {/* Individual Leader */}
      {leader ? (
        <div className="glass rounded-2xl p-4 leader-border">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">🥇 Individual Leader — Stroke Play</p>
          <div className="flex items-center gap-3">
            <div className={`avatar ${leader.team === 'A' ? 'avatar-a' : 'avatar-b'}`}>
              {leader.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-100 truncate">{leader.name}</p>
              <p className="text-xs text-slate-500">
                Team {leader.team} · HC {leader.handicap} · {leader.holesPlayed}H played
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-xl ${toParColor(leader.toPar)}`}>{toParLabel(leader.toPar)}</p>
              <p className="text-xs text-slate-500">{leader.totalStrokes} strokes</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/scores')}
            className="btn-outline w-full mt-3 py-2 text-sm justify-center"
          >
            View Full Leaderboard →
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-slate-500 text-sm">No scores entered yet</p>
          <button onClick={() => navigate('/entry')} className="btn-gold mt-3 py-2 px-6 text-sm">
            ✏️ Enter Your Scores
          </button>
        </div>
      )}

      {/* Course info */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">⛳ Course</p>
        <p className="font-serif text-base font-semibold text-slate-200">Las Colinas Golf & Country Club</p>
        <p className="text-xs text-slate-500 mt-1">Par {coursePar} · {courseYardage.toLocaleString()} yards · Championship layout</p>
        <p className="text-xs text-slate-500 mt-1">Jun 18–22, 2026</p>
      </div>

      {/* Schedule Preview */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">📅 Schedule Preview</p>
        <div className="space-y-3">
          {ITINERARY.slice(0, 4).map((day, i) => (
            <div
              key={day.day}
              className={`flex items-center gap-3 ${i < 3 ? 'pb-3 border-b border-white/5' : ''}`}
            >
              <span className="text-lg">{day.activities[0]?.emoji || '📅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{day.label}</p>
                <p className="text-xs text-slate-500">{day.date}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/schedule')} className="btn-outline w-full mt-3 py-2 text-sm justify-center">
          View Full Schedule →
        </button>
      </div>

      {/* Quick Links */}
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 ml-1">Quick Access</p>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="btn-outline py-3 text-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
