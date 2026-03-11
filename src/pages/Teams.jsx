import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAllScores } from '../lib/supabase'
import { HOLES, EVENTS_STATIC, computeScore, toParLabel, toParColor } from '../constants/course'

function computeTeamResults(allScores, players) {
  let teamAPoints = 0, teamBPoints = 0
  const eventResults = EVENTS_STATIC.map(ev => {
    const evScores = allScores[ev.id] || {}
    const aPlayers = players.filter(p => p.team === 'A')
    const bPlayers = players.filter(p => p.team === 'B')

    let aTotal = 0, bTotal = 0, hasData = false
    const aContribs = aPlayers.map(p => {
      const s = computeScore(evScores[p.id] || {})
      if (s.holesPlayed > 0) { aTotal += s.toPar; hasData = true }
      return { ...p, ...s }
    })
    const bContribs = bPlayers.map(p => {
      const s = computeScore(evScores[p.id] || {})
      if (s.holesPlayed > 0) { bTotal += s.toPar; hasData = true }
      return { ...p, ...s }
    })

    let winner = null
    if (hasData) {
      if (aTotal < bTotal) { winner = 'A'; teamAPoints++ }
      else if (bTotal < aTotal) { winner = 'B'; teamBPoints++ }
      else if (aTotal === bTotal) winner = 'tie'
    }

    return { ev, aTotal, bTotal, aContribs, bContribs, winner, hasData }
  })

  return { teamAPoints, teamBPoints, eventResults }
}

export default function Teams() {
  const { players } = useAuth()
  const [allScores, setAllScores] = useState({})

  useEffect(() => {
    fetchAllScores().then(d => setAllScores(d || {}))
  }, [])

  const { teamAPoints, teamBPoints, eventResults } = computeTeamResults(allScores, players)
  const aPlayers = players.filter(p => p.team === 'A')
  const bPlayers = players.filter(p => p.team === 'B')

  return (
    <div className="p-4 pb-6 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Ryder Cup Format</p>
        <h1 className="page-title mt-0.5">Teams</h1>
      </div>

      {/* Ryder Cup Big Score */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}
      >
        <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-4">🏆 Ryder Cup Score</p>
        <div className="flex items-center justify-center gap-6">
          <div className="flex-1 text-center">
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Team A</p>
            <p className="font-serif text-7xl font-bold text-green-400">{teamAPoints}</p>
          </div>
          <div className="text-slate-600 font-light tracking-widest">VS</div>
          <div className="flex-1 text-center">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">Team B</p>
            <p className="font-serif text-7xl font-bold text-blue-400">{teamBPoints}</p>
          </div>
        </div>
        <p className="text-center text-slate-600 text-xs mt-4">
          {EVENTS_STATIC.length} events · 1 point per event won
        </p>
      </div>

      {/* Event-by-event results */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">📊 Event Results</p>
        <div className="space-y-3">
          {eventResults.map(({ ev, aTotal, bTotal, winner, hasData }, i) => (
            <div key={ev.id} className={`${i < eventResults.length - 1 ? 'pb-3 border-b border-white/5' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-200">{ev.emoji} {ev.name}</p>
                  <p className="text-xs text-slate-500">Day {ev.day}</p>
                </div>
                {hasData ? (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    winner === 'A' ? 'bg-green-500/20 text-green-400' :
                    winner === 'B' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-slate-400'
                  }`}>
                    {winner === 'A' ? 'Team A Wins' : winner === 'B' ? 'Team B Wins' : 'Tied'}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-600">Upcoming</span>
                )}
              </div>
              {hasData && (
                <div className="grid grid-cols-2 gap-2">
                  <div className={`text-center p-2 rounded-xl ${winner === 'A' ? 'bg-green-500/10' : 'bg-white/5'}`}>
                    <p className="text-[10px] text-green-400/70">Team A</p>
                    <p className={`font-bold text-lg ${winner === 'A' ? 'text-green-400' : 'text-slate-400'}`}>
                      {toParLabel(aTotal)}
                    </p>
                  </div>
                  <div className={`text-center p-2 rounded-xl ${winner === 'B' ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                    <p className="text-[10px] text-blue-400/70">Team B</p>
                    <p className={`font-bold text-lg ${winner === 'B' ? 'text-blue-400' : 'text-slate-400'}`}>
                      {toParLabel(bTotal)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team A Roster */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-green-400 uppercase tracking-widest mb-3">🟢 Team A Roster</p>
        <div className="space-y-3">
          {aPlayers.map((p, i) => {
            const ev1 = computeScore((allScores['ind'] || {})[p.id] || {})
            return (
              <div key={p.id} className={`flex items-center gap-3 ${i < aPlayers.length - 1 ? 'pb-3 border-b border-white/5' : ''}`}>
                <div className="avatar avatar-a shrink-0">{p.avatar}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">HC {p.handicap}</p>
                </div>
                {ev1.holesPlayed > 0 && (
                  <p className={`font-bold text-sm ${toParColor(ev1.toPar)}`}>{toParLabel(ev1.toPar)}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Team B Roster */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-blue-400 uppercase tracking-widest mb-3">🔵 Team B Roster</p>
        <div className="space-y-3">
          {bPlayers.map((p, i) => {
            const ev1 = computeScore((allScores['ind'] || {})[p.id] || {})
            return (
              <div key={p.id} className={`flex items-center gap-3 ${i < bPlayers.length - 1 ? 'pb-3 border-b border-white/5' : ''}`}>
                <div className="avatar avatar-b shrink-0">{p.avatar}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">HC {p.handicap}</p>
                </div>
                {ev1.holesPlayed > 0 && (
                  <p className={`font-bold text-sm ${toParColor(ev1.toPar)}`}>{toParLabel(ev1.toPar)}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
