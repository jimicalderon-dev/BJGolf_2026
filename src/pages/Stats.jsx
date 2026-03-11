import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAllScores } from '../lib/supabase'
import { HOLES, EVENTS_STATIC, scoreClass } from '../constants/course'

function getPlayerStats(holeScores, holes) {
  let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubles = 0, total = 0, holesPlayed = 0
  holes.forEach(h => {
    const s = holeScores[h.number]
    if (s === undefined) return
    const d = s - h.par
    if (d <= -2) eagles++
    else if (d === -1) birdies++
    else if (d === 0) pars++
    else if (d === 1) bogeys++
    else doubles++
    total += s
    holesPlayed++
  })
  return { eagles, birdies, pars, bogeys, doubles, total, holesPlayed, avg: holesPlayed ? (total / holesPlayed).toFixed(1) : '—' }
}

function CompareBar({ labelLeft, valA, valB, higherIsBetter = false }) {
  const maxVal = Math.max(valA, valB, 1)
  const pctA = (valA / maxVal) * 100
  const pctB = (valB / maxVal) * 100
  const aWins = higherIsBetter ? valA >= valB : valA <= valB
  const bWins = higherIsBetter ? valB >= valA : valB <= valA

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{labelLeft}</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${aWins ? 'text-yellow-400' : 'text-slate-500'}`}>{valA}</span>
          <span className="text-slate-700 text-xs">vs</span>
          <span className={`text-sm font-bold ${bWins ? 'text-blue-400' : 'text-slate-500'}`}>{valB}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-0.5 h-2">
        <div className="flex justify-end overflow-hidden rounded-l-full bg-white/5">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{ width: `${pctA}%`, background: aWins ? '#FFD700' : 'rgba(255,215,0,0.3)' }}
          />
        </div>
        <div className="overflow-hidden rounded-r-full bg-white/5">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{ width: `${pctB}%`, background: bWins ? '#3b82f6' : 'rgba(59,130,246,0.3)' }}
          />
        </div>
      </div>
    </div>
  )
}

function BreakdownBars({ stats, color }) {
  const total = stats.holesPlayed || 1
  const items = [
    { label: '🦅 Eagles',   val: stats.eagles,  col: '#FFD700' },
    { label: '🐦 Birdies',  val: stats.birdies, col: '#4CAF50' },
    { label: '⬜ Pars',     val: stats.pars,    col: '#94a3b8' },
    { label: '🟠 Bogeys',   val: stats.bogeys,  col: '#e88c4f' },
    { label: '🔴 Dbl+',    val: stats.doubles,  col: '#e85d5d' },
  ]
  return (
    <div className="space-y-2">
      {items.map(({ label, val, col }) => (
        <div key={label}>
          <div className="flex justify-between mb-0.5">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-bold" style={{ color: col }}>{val}</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(val / total) * 100}%`, background: col }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Stats() {
  const { players } = useAuth()
  const [allScores, setAllScores] = useState({})
  const [playerAId, setPlayerAId] = useState(null)
  const [playerBId, setPlayerBId] = useState(null)
  const [eventIdx, setEventIdx]   = useState(0)

  useEffect(() => {
    fetchAllScores().then(d => setAllScores(d || {}))
  }, [])

  useEffect(() => {
    if (players.length >= 2) {
      setPlayerAId(players[0]?.id || null)
      setPlayerBId(players[1]?.id || null)
    }
  }, [players])

  const event   = EVENTS_STATIC[eventIdx]
  const evScores = allScores[event.id] || {}

  const pA = players.find(p => p.id === playerAId)
  const pB = players.find(p => p.id === playerBId)
  const sA = pA ? getPlayerStats(evScores[pA.id] || {}, HOLES) : null
  const sB = pB ? getPlayerStats(evScores[pB.id] || {}, HOLES) : null

  return (
    <div className="p-4 pb-6 space-y-4">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Analysis</p>
        <h1 className="page-title mt-0.5">Stats</h1>
      </div>

      {/* Event selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {EVENTS_STATIC.map((ev, i) => (
          <button key={ev.id} onClick={() => setEventIdx(i)} className={`pill shrink-0 ${eventIdx === i ? 'active' : ''}`}>
            {ev.emoji} {ev.name}
          </button>
        ))}
      </div>

      {/* Head-to-head selector */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">⚔️ Head-to-Head</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[10px] text-yellow-400/70 mb-1">Player A</p>
            <select
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.2)', color: '#e2e8f0' }}
              value={playerAId || ''}
              onChange={e => setPlayerAId(e.target.value)}
            >
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] text-blue-400/70 mb-1">Player B</p>
            <select
              className="w-full text-sm rounded-xl px-3 py-2 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59,130,246,0.2)', color: '#e2e8f0' }}
              value={playerBId || ''}
              onChange={e => setPlayerBId(e.target.value)}
            >
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {sA && sB && (sA.holesPlayed > 0 || sB.holesPlayed > 0) ? (
          <div className="space-y-1">
            <CompareBar labelLeft="Eagles"   valA={sA.eagles}  valB={sB.eagles}  higherIsBetter />
            <CompareBar labelLeft="Birdies"  valA={sA.birdies} valB={sB.birdies} higherIsBetter />
            <CompareBar labelLeft="Pars"     valA={sA.pars}    valB={sB.pars}    higherIsBetter />
            <CompareBar labelLeft="Bogeys"   valA={sA.bogeys}  valB={sB.bogeys}  />
            <CompareBar labelLeft="Doubles+" valA={sA.doubles} valB={sB.doubles} />
            <CompareBar labelLeft="Total"    valA={sA.total}   valB={sB.total}   />
          </div>
        ) : (
          <p className="text-center text-slate-500 text-sm py-4">No scores to compare yet</p>
        )}
      </div>

      {/* Individual breakdowns */}
      {sA && sB && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-3" style={{ border: '1px solid rgba(255,215,0,0.1)' }}>
            <p className="text-[10px] text-yellow-400 mb-1">{pA?.name}</p>
            <p className="text-xs text-slate-500 mb-2">{sA.holesPlayed}H · {sA.total} strokes</p>
            {sA.holesPlayed > 0 ? <BreakdownBars stats={sA} /> : <p className="text-slate-600 text-xs">No scores</p>}
          </div>
          <div className="glass rounded-2xl p-3" style={{ border: '1px solid rgba(59,130,246,0.1)' }}>
            <p className="text-[10px] text-blue-400 mb-1">{pB?.name}</p>
            <p className="text-xs text-slate-500 mb-2">{sB.holesPlayed}H · {sB.total} strokes</p>
            {sB.holesPlayed > 0 ? <BreakdownBars stats={sB} /> : <p className="text-slate-600 text-xs">No scores</p>}
          </div>
        </div>
      )}

      {/* All players distribution */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">📊 All Players — Scoring Distribution</p>
        <div className="space-y-2">
          {players.map(p => {
            const s = getPlayerStats(evScores[p.id] || {}, HOLES)
            const total = s.holesPlayed || 1
            return (
              <div key={p.id}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`avatar text-[9px] ${p.team === 'A' ? 'avatar-a' : 'avatar-b'}`} style={{ width: 22, height: 22 }}>
                    {p.avatar}
                  </div>
                  <span className="text-xs text-slate-400 flex-1 truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-600">{s.holesPlayed}H</span>
                </div>
                {s.holesPlayed > 0 ? (
                  <div className="flex h-2 rounded-full overflow-hidden gap-px">
                    {[
                      { val: s.eagles,  col: '#FFD700' },
                      { val: s.birdies, col: '#4CAF50' },
                      { val: s.pars,    col: '#94a3b8' },
                      { val: s.bogeys,  col: '#e88c4f' },
                      { val: s.doubles, col: '#e85d5d' },
                    ].map(({ val, col }, i) =>
                      val > 0 ? (
                        <div key={i} className="h-full" style={{ width: `${(val / total) * 100}%`, background: col }} />
                      ) : null
                    )}
                  </div>
                ) : (
                  <div className="h-2 rounded-full bg-white/5" />
                )}
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {[['#FFD700','Eagle'],['#4CAF50','Birdie'],['#94a3b8','Par'],['#e88c4f','Bogey'],['#e85d5d','Dbl+']].map(([col, label]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: col }} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
