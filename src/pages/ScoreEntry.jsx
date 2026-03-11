import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { upsertHoleScore, insertNotification, fetchScores, fetchHoleStats, fetchTeeTimes, upsertTeeTime, isConfigured } from '../lib/supabase'
import { HOLES, EVENTS_STATIC, toParLabel, toParColor, scoreClass } from '../constants/course'

export default function ScoreEntry() {
  const { player } = useAuth()
  const holes = HOLES
  const [eventIdx, setEventIdx]     = useState(0)
  const [holeIdx, setHoleIdx]       = useState(0)
  const [holeScores, setHoleScores] = useState({}) // { hole_number: strokes }
  const [teeGroup, setTeeGroup]     = useState(1)  // 1 | 2 | 3
  const [holeStats, setHoleStats]   = useState({}) // { [hole_number]: { putts, fairway_hit } }
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const saveTimer                   = useRef(null)

  const event = EVENTS_STATIC[eventIdx]
  const hole  = holes[holeIdx]
  const current = holeScores[hole.number] ?? hole.par

  // Load existing scores + tee time for this event
  useEffect(() => {
    if (!player || !isConfigured) return
    fetchScores(event.id).then(data => {
      const playerScores = data[player.id] || {}
      setHoleScores(playerScores)
    })
    fetchTeeTimes(event.id).then(data => {
      setTeeGroup(data[player.id] ?? 1)
    })
    fetchHoleStats(event.id, player.id).then(setHoleStats)
  }, [event.id, player])

  const handleTeeGroup = async (group) => {
    setTeeGroup(group)
    if (player && isConfigured) await upsertTeeTime(player.id, event.id, group)
  }

  // Compute running total
  const { totalStrokes, toPar, holesPlayed } = (() => {
    let ts = 0, tp = 0, hp = 0
    holes.forEach(h => {
      const s = holeScores[h.number]
      if (s !== undefined) { ts += s; tp += h.par; hp++ }
    })
    return { totalStrokes: ts, toPar: ts - tp, holesPlayed: hp }
  })()

  const currentStats = holeStats[hole.number] ?? {}
  const currentPutts   = currentStats.putts       ?? null
  const currentFairway = currentStats.fairway_hit ?? null
  const gir = (holeScores[hole.number] !== undefined && currentPutts !== null)
    ? (current - currentPutts) <= (hole.par - 2)
    : null

  const setScore = (val) => {
    const clamped = Math.max(1, Math.min(15, val))
    setHoleScores(prev => ({ ...prev, [hole.number]: clamped }))
  }

  const setPutts = (val) => {
    const clamped = Math.max(0, Math.min(10, val))
    setHoleStats(prev => ({
      ...prev,
      [hole.number]: { ...prev[hole.number], putts: clamped },
    }))
  }

  const setFairway = (val) => {
    setHoleStats(prev => ({
      ...prev,
      [hole.number]: { ...prev[hole.number], fairway_hit: val },
    }))
  }

  const saveHole = async () => {
    if (!player || !isConfigured) return
    setSaving(true)
    const strokes = holeScores[hole.number]
    if (!strokes) { setSaving(false); return }

    const stats = holeStats[hole.number] ?? {}
    const err = await upsertHoleScore(
      player.id, event.id, hole.number, strokes,
      stats.putts ?? undefined,
      stats.fairway_hit ?? undefined
    )
    if (!err) {
      // Trigger notification for birdie or eagle
      const diff = strokes - hole.par
      if (diff <= -1) {
        const type    = diff <= -2 ? 'eagle' : 'birdie'
        const emoji   = diff <= -2 ? '🦅' : '🐦'
        const label   = diff <= -2 ? 'EAGLE' : 'BIRDIE'
        await insertNotification(
          type,
          `${emoji} ${player.name} made ${label} on Hole ${hole.number}!`,
          player.id
        )
      }
      setSaved(true)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (!player) {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-slate-500">Please log in to enter scores.</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-6">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{player.name}</p>
        <h1 className="page-title mt-0.5">Score Entry</h1>
      </div>

      {/* Event selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 -mx-1 px-1">
        {EVENTS_STATIC.map((ev, i) => (
          <button
            key={ev.id}
            onClick={() => { setEventIdx(i); setHoleIdx(0); setHoleScores({}) }}
            className={`pill shrink-0 ${eventIdx === i ? 'active' : ''}`}
          >
            {ev.emoji} {ev.name}
          </button>
        ))}
      </div>

      {/* Tee Group selector */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest shrink-0">Tee Group</span>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(g => (
            <button
              key={g}
              onClick={() => handleTeeGroup(g)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                teeGroup === g
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                  : 'bg-white/5 text-slate-500 border border-white/10'
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>
      </div>

      {/* Hole info */}
      <div
        className="rounded-2xl p-5 mb-4 text-center"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Hole</p>
        <p className="font-serif text-7xl font-bold gold-text leading-none">{hole.number}</p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Par</p>
            <p className="text-2xl font-bold text-slate-200">{hole.par}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Yards</p>
            <p className="text-2xl font-bold text-slate-200">{hole.yards}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">SI</p>
            <p className="text-2xl font-bold text-slate-200">{hole.si}</p>
          </div>
        </div>
      </div>

      {/* Score input */}
      <div className="glass rounded-2xl p-5 mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center mb-4">Strokes</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setScore(current - 1)}
            className="w-16 h-16 rounded-full text-3xl font-bold text-slate-300 transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            −
          </button>

          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-5xl ${
              holeScores[hole.number] !== undefined
                ? scoreClass(current, hole.par)
                : 'text-slate-400'
            }`}
            style={{
              background: holeScores[hole.number] !== undefined ? undefined : 'rgba(255,255,255,0.05)',
              border: '2px solid rgba(255,255,255,0.1)',
            }}
          >
            {current}
          </div>

          <button
            onClick={() => setScore(current + 1)}
            className="w-16 h-16 rounded-full text-3xl font-bold text-slate-300 transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            +
          </button>
        </div>

        {/* Score label */}
        {holeScores[hole.number] !== undefined && (() => {
          const diff = current - hole.par
          const labels = { [-2]: '🦅 Eagle!', [-1]: '🐦 Birdie!', 0: '✓ Par', 1: '👎 Bogey', 2: '⛔ Double' }
          const label = labels[diff] ?? (diff < 0 ? '🦅 Eagle!' : '⛔ Triple+')
          return <p className="text-center text-sm mt-3 text-slate-400">{label}</p>
        })()}

        {/* Divider */}
        <div className="border-t border-white/5 mt-4 pt-4 space-y-3">

          {/* Putts */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Putts</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => currentPutts !== null && setPutts(currentPutts - 1)}
                className="w-8 h-8 rounded-full text-lg font-bold text-slate-300 transition-all active:scale-90 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >−</button>
              <span
                className={`w-10 text-center font-bold text-xl ${currentPutts !== null ? 'text-slate-200' : 'text-slate-600'}`}
              >
                {currentPutts !== null ? currentPutts : '—'}
              </span>
              <button
                onClick={() => setPutts((currentPutts ?? -1) + 1)}
                className="w-8 h-8 rounded-full text-lg font-bold text-slate-300 transition-all active:scale-90 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >+</button>
            </div>
          </div>

          {/* GIR badge (shown when putts and strokes are both set) */}
          {gir !== null && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Green in Reg.</p>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  gir
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                {gir ? '✅ GIR' : '❌ Missed'}
              </span>
            </div>
          )}

          {/* Fairway hit (par 4 / par 5 only) */}
          {hole.par >= 4 && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Fairway Hit</p>
              <div className="flex gap-1.5">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    onClick={() => setFairway(val)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      currentFairway === val
                        ? val
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-slate-500 border border-white/10'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={saveHole}
          disabled={saving || !holeScores[hole.number]}
          className={`btn-gold w-full mt-4 py-3 justify-center text-base transition-all ${
            saved ? 'opacity-80' : ''
          }`}
          style={{ opacity: saving || !holeScores[hole.number] ? 0.5 : 1 }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : '💾 Save Score'}
        </button>

        {!isConfigured && (
          <p className="text-center text-xs text-slate-600 mt-2">
            Connect Supabase to sync scores to the cloud
          </p>
        )}
      </div>

      {/* Hole navigation */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => setHoleIdx(i => Math.max(0, i - 1))}
          disabled={holeIdx === 0}
          className="btn-outline px-6 py-2 text-sm disabled:opacity-30"
        >
          ← Prev
        </button>
        <span className="text-sm text-slate-500">{holeIdx + 1} / 18</span>
        <button
          onClick={() => setHoleIdx(i => Math.min(17, i + 1))}
          disabled={holeIdx === 17}
          className="btn-outline px-6 py-2 text-sm disabled:opacity-30"
        >
          Next →
        </button>
      </div>

      {/* Hole dots */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {holes.map((h, i) => {
          const s = holeScores[h.number]
          const isActive = i === holeIdx
          return (
            <button
              key={h.number}
              onClick={() => setHoleIdx(i)}
              className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                isActive ? 'ring-2 ring-yellow-400/60' : ''
              } ${s !== undefined ? scoreClass(s, h.par) : 'bg-white/5 text-slate-600'}`}
            >
              {h.number}
            </button>
          )
        })}
      </div>

      {/* Running total */}
      {holesPlayed > 0 && (
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Running Total</p>
          <div className="flex items-center justify-center gap-6">
            <div>
              <p className="text-xs text-slate-500">Strokes</p>
              <p className="font-serif text-3xl font-bold text-slate-200">{totalStrokes}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">To Par</p>
              <p className={`font-serif text-3xl font-bold ${toParColor(toPar)}`}>{toParLabel(toPar)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Holes</p>
              <p className="font-serif text-3xl font-bold text-slate-200">{holesPlayed}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
