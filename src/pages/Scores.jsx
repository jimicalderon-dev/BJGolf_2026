import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useScores } from '../hooks/useScores'
import { fetchAllScores, fetchTeeTimes } from '../lib/supabase'
import { HOLES, EVENTS_STATIC, computeScore, toParLabel, toParColor, scoreClass } from '../constants/course'

const TABS = [
  { id: 'total', label: 'Total',          emoji: '🏆', eventId: null  },
  { id: 'ind',   label: 'R1 · Ind.',      emoji: '🏌️', eventId: 'ind' },
  { id: 'bb',    label: 'R2 · Best Ball', emoji: '🤝', eventId: 'bb'  },
  { id: 'scr',   label: 'R3 · Scramble',  emoji: '🔄', eventId: 'scr' },
  { id: 'alt',   label: 'R4 · Alt.',      emoji: '🔁', eventId: 'alt' },
  { id: 'rc',    label: 'R5 · Ryder',     emoji: '⚔️', eventId: 'rc'  },
]

// ── Skins calculation ──────────────────────────────────────────
function computeSkins(scores, players, holes, teeTimes) {
  const groups = { 1: [], 2: [], 3: [] }
  players.forEach(p => {
    const g = teeTimes[p.id] ?? 1
    groups[g].push(p.id)
  })

  const skinCounts = {}
  players.forEach(p => { skinCounts[p.id] = 0 })

  holes.forEach(h => {
    Object.entries(groups).forEach(([, memberIds]) => {
      if (memberIds.length < 2) return
      const withScore = memberIds.filter(id => scores[id]?.[h.number] !== undefined)
      if (withScore.length < 2) return
      const minScore = Math.min(...withScore.map(id => scores[id][h.number]))
      const leaders  = withScore.filter(id => scores[id][h.number] === minScore)
      if (leaders.length === 1) skinCounts[leaders[0]]++
    })
  })

  return { skinCounts, groups }
}

// ── Shared components ──────────────────────────────────────────
function HoleBadge({ strokes, par }) {
  if (!strokes) return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-slate-600 bg-white/5">—</div>
  )
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${scoreClass(strokes, par)}`}>
      {strokes}
    </div>
  )
}

function PlayerRow({ p, rank, isMe, holeScores, isExpanded, onToggle, subLabel }) {
  const { toPar, totalStrokes, holesPlayed } = computeScore(holeScores)
  const isLeader = rank === 1

  return (
    <div>
      <div
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-3 cursor-pointer transition-colors active:bg-white/5 ${
          isLeader ? 'leader-border rounded-xl' : 'border-b border-white/5'
        } ${isMe ? 'bg-yellow-500/5' : ''}`}
      >
        <div className={`text-sm font-bold w-6 text-center shrink-0 ${isLeader ? 'text-yellow-400' : 'text-slate-500'}`}>
          {holesPlayed === 0 ? '—' : rank}
        </div>
        <div className={`avatar shrink-0 ${p.team === 'A' ? 'avatar-a' : 'avatar-b'}`}>{p.avatar}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isMe ? 'text-yellow-300' : 'text-slate-200'}`}>{p.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={p.team === 'A' ? 'badge-a' : 'badge-b'}>Team {p.team}</span>
            <span className="text-[10px] text-slate-600">{subLabel ?? `HC ${p.handicap}`}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-bold text-base ${holesPlayed > 0 ? toParColor(toPar) : 'text-slate-600'}`}>
            {holesPlayed > 0 ? toParLabel(toPar) : '—'}
          </p>
          <p className="text-[10px] text-slate-600">{holesPlayed > 0 ? `${totalStrokes} (${holesPlayed}H)` : 'DNS'}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 py-3 bg-white/[0.03] border-b border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Hole by hole</p>
          <div className="grid grid-cols-9 gap-1">
            {HOLES.map(h => (
              <HoleBadge key={h.number} strokes={holeScores[h.number]} par={h.par} />
            ))}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            {[
              { label: '🦅 Eagle', cls: 'sc-eagle' },
              { label: '🐦 Birdie', cls: 'sc-birdie' },
              { label: '⬜ Par', cls: 'sc-par' },
              { label: '🟠 Bogey', cls: 'sc-bogey' },
              { label: '🔴 Dbl+', cls: 'sc-double' },
            ].map(({ label, cls }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`w-4 h-4 rounded-full ${cls} inline-block`} />
                <span className="text-[10px] text-slate-500">{label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Total tab leaderboard ──────────────────────────────────────
function TotalLeaderboard({ allScores, players, myId }) {
  const totals = players.map(p => {
    let totalToPar = 0, roundsPlayed = 0, totalStrokes = 0
    EVENTS_STATIC.forEach(ev => {
      const { toPar, holesPlayed, totalStrokes: ts } = computeScore(allScores[ev.id]?.[p.id] || {})
      if (holesPlayed > 0) { totalToPar += toPar; roundsPlayed++; totalStrokes += ts }
    })
    return { ...p, totalToPar, roundsPlayed, totalStrokes }
  }).sort((a, b) => {
    if (a.roundsPlayed === 0 && b.roundsPlayed === 0) return 0
    if (a.roundsPlayed === 0) return 1
    if (b.roundsPlayed === 0) return -1
    return a.totalToPar - b.totalToPar
  })

  let rank = 1
  const withRanks = totals.map((p, i, arr) => {
    if (i > 0 && p.totalToPar === arr[i - 1].totalToPar && arr[i - 1].roundsPlayed > 0) return { ...p, rank }
    if (p.roundsPlayed > 0) rank = i + 1
    return { ...p, rank: p.roundsPlayed > 0 ? rank : null }
  })

  return (
    <>
      {withRanks.map(p => {
        const isMe     = myId === p.id
        const isLeader = p.rank === 1
        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-3 ${
              isLeader ? 'leader-border rounded-xl' : 'border-b border-white/5'
            } ${isMe ? 'bg-yellow-500/5' : ''}`}
          >
            <div className={`text-sm font-bold w-6 text-center shrink-0 ${isLeader ? 'text-yellow-400' : 'text-slate-500'}`}>
              {p.roundsPlayed === 0 ? '—' : p.rank}
            </div>
            <div className={`avatar shrink-0 ${p.team === 'A' ? 'avatar-a' : 'avatar-b'}`}>{p.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isMe ? 'text-yellow-300' : 'text-slate-200'}`}>{p.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={p.team === 'A' ? 'badge-a' : 'badge-b'}>Team {p.team}</span>
                <span className="text-[10px] text-slate-600">
                  {p.roundsPlayed > 0 ? `${p.roundsPlayed}R played` : 'DNS'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-base ${p.roundsPlayed > 0 ? toParColor(p.totalToPar) : 'text-slate-600'}`}>
                {p.roundsPlayed > 0 ? toParLabel(p.totalToPar) : '—'}
              </p>
              <p className="text-[10px] text-slate-600">
                {p.roundsPlayed > 0 ? `${p.totalStrokes} total` : ''}
              </p>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ── Skins section (collapsible) ────────────────────────────────
function SkinsSection({ scores, players, teeTimes }) {
  const [open, setOpen] = useState(false)
  const { skinCounts, groups } = computeSkins(scores, players, HOLES, teeTimes)
  const playerMap  = Object.fromEntries(players.map(p => [p.id, p]))
  const skinsLeaders = players.filter(p => skinCounts[p.id] > 0)
    .sort((a, b) => skinCounts[b.id] - skinCounts[a.id])
  const activeGroups = Object.entries(groups).filter(([, ids]) => ids.length >= 2)

  return (
    <div className="mt-3 mx-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span>🎯 {open ? 'Hide Skins' : 'Show Skins'}</span>
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="mt-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Skins leaderboard */}
          <div className="px-3 py-3 border-b border-white/5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Skins Leaders</p>
            {skinsLeaders.length > 0 ? (
              <div className="space-y-1.5">
                {skinsLeaders.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className={`avatar shrink-0 text-xs w-6 h-6 ${p.team === 'A' ? 'avatar-a' : 'avatar-b'}`}>{p.avatar}</div>
                    <span className="text-sm text-slate-200 flex-1">{p.name}</span>
                    <span className="text-yellow-400 font-bold text-sm">
                      {skinCounts[p.id]} skin{skinCounts[p.id] !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 text-center">No skins decided yet</p>
            )}
          </div>

          {/* Per-group hole grid */}
          {activeGroups.length > 0 ? activeGroups.map(([groupNum, memberIds]) => {
            const groupPlayers = memberIds.map(id => playerMap[id]).filter(Boolean)
            return (
              <div key={groupNum} className="px-3 py-3 border-b border-white/5 last:border-b-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                  Group {groupNum} · {groupPlayers.map(p => p.name.split(' ')[0]).join(', ')}
                </p>
                <div className="grid grid-cols-9 gap-1">
                  {HOLES.map(h => {
                    const withScore = memberIds.filter(id => scores[id]?.[h.number] !== undefined)
                    if (withScore.length < 2) {
                      return (
                        <div key={h.number} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-slate-700 bg-white/5">
                          {h.number}
                        </div>
                      )
                    }
                    const minScore = Math.min(...withScore.map(id => scores[id][h.number]))
                    const leaders  = withScore.filter(id => scores[id][h.number] === minScore)
                    if (leaders.length !== 1) {
                      return (
                        <div key={h.number} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-slate-500 bg-white/5 border border-white/10">
                          T
                        </div>
                      )
                    }
                    const winner = playerMap[leaders[0]]
                    return (
                      <div
                        key={h.number}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                        title={`H${h.number}: ${winner?.name}`}
                      >
                        {winner?.avatar ?? '?'}
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-3 mt-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/30 inline-block" />
                    <span className="text-[9px] text-slate-600">Skin</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-white/5 border border-white/10 inline-block" />
                    <span className="text-[9px] text-slate-600">Tied/pending</span>
                  </span>
                </div>
              </div>
            )
          }) : (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-slate-500">Set tee groups in Score Entry to see skins by group</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Round leaderboard + skins (shares one useScores call) ─────
function RoundView({ eventId, players, myId }) {
  const { scores, loading } = useScores(eventId)
  const [teeTimes, setTeeTimes]   = useState({})
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchTeeTimes(eventId).then(setTeeTimes)
  }, [eventId])

  const ranked = [...players]
    .map(p => ({ ...p, score: computeScore(scores[p.id] || {}) }))
    .sort((a, b) => {
      if (a.score.holesPlayed === 0 && b.score.holesPlayed === 0) return 0
      if (a.score.holesPlayed === 0) return 1
      if (b.score.holesPlayed === 0) return -1
      return a.score.toPar - b.score.toPar
    })

  let rank = 1
  const withRanks = ranked.map((p, i, arr) => {
    if (i > 0 && p.score.toPar === arr[i - 1].score.toPar && arr[i - 1].score.holesPlayed > 0) return { ...p, rank }
    if (p.score.holesPlayed > 0) rank = i + 1
    return { ...p, rank: p.score.holesPlayed > 0 ? rank : null }
  })

  return (
    <>
      <div
        className="mx-4 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Column headers */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <div className="w-6 text-[10px] text-slate-600 text-center">#</div>
          <div className="w-8 shrink-0" />
          <div className="flex-1 text-[10px] text-slate-600 uppercase tracking-wider">Player</div>
          <div className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Score</div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading scores…</div>
        ) : (
          withRanks.map(p => (
            <PlayerRow
              key={p.id}
              p={p}
              rank={p.rank}
              isMe={myId === p.id}
              holeScores={scores[p.id] || {}}
              isExpanded={expandedId === p.id}
              onToggle={() => setExpandedId(prev => prev === p.id ? null : p.id)}
              subLabel={`Grp ${teeTimes[p.id] ?? 1} · HC ${p.handicap}`}
            />
          ))
        )}
      </div>

      {!loading && (
        <p className="text-center text-[10px] text-slate-600 mt-3 mx-4">
          Tap any player to see hole-by-hole scores · Updates live
        </p>
      )}

      <SkinsSection scores={scores} players={players} teeTimes={teeTimes} />
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function Scores() {
  const { player, players } = useAuth()
  const [tabId, setTabId]   = useState('total')
  const [allScores, setAllScores]   = useState({})
  const [loadingAll, setLoadingAll] = useState(true)

  const activeTab = TABS.find(t => t.id === tabId) ?? TABS[0]

  useEffect(() => {
    fetchAllScores().then(data => { setAllScores(data || {}); setLoadingAll(false) })
  }, [])

  return (
    <div className="pb-4 space-y-0">
      {/* Header */}
      <div className="p-4 pb-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Real-time</p>
        <h1 className="page-title mt-0.5">Leaderboard</h1>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabId(tab.id)}
            className={`pill shrink-0 ${tabId === tab.id ? 'active' : ''}`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tabId === 'total' ? (
        <div className="mx-4">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <div className="w-6 text-[10px] text-slate-600 text-center">#</div>
              <div className="w-8 shrink-0" />
              <div className="flex-1 text-[10px] text-slate-600 uppercase tracking-wider">Player</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider text-right">Score</div>
            </div>
            {loadingAll ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading…</div>
            ) : (
              <TotalLeaderboard allScores={allScores} players={players} myId={player?.id} />
            )}
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-3">
            Sum of to-par across all rounds played
          </p>
        </div>
      ) : (
        <RoundView key={activeTab.eventId} eventId={activeTab.eventId} players={players} myId={player?.id} />
      )}
    </div>
  )
}
