import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { CHALLENGES } from '../constants/course'
import { fetchChallengeResults, insertChallengeResult, isConfigured } from '../lib/supabase'

const WOLF_RULES = [
  { icon: '🔄', title: 'Rotation', text: 'Players rotate as the Wolf each hole in a fixed order. Hole 1 → Player 1 is Wolf, Hole 2 → Player 2, etc.' },
  { icon: '👁️', title: 'Watch & Choose', text: 'The Wolf tees off first, then watches each partner tee off one by one. After each tee shot the Wolf decides: partner up, or pass.' },
  { icon: '🤝', title: '2 vs 2', text: 'Wolf picks exactly one partner → it\'s 2 v 2 for that hole. If the Wolf\'s side wins, both earn 1 pt from each opponent.' },
  { icon: '🐺', title: 'Lone Wolf', text: 'If the Wolf skips all three partners, they play Lone Wolf (1 v 3). Win = +3 pts from each opponent. Lose = −3 pts to each opponent.' },
  { icon: '⚡', title: 'Blind Wolf', text: 'Declare Lone Wolf BEFORE anyone tees off for max risk/reward: Win = +4 pts, Lose = −4 pts each.' },
  { icon: '🏆', title: 'Winning', text: 'Most total points across all holes wins. Submit your net points below after each round.' },
]

function WolfCard({ ch, results, player, onSubmit }) {
  const [inputVal, setInputVal]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  const myResults = results.filter(r => r.challenge_id === ch.id)
  const sorted    = [...myResults].sort((a, b) => b.value - a.value)
  const leader    = sorted[0]

  const handleSubmit = async () => {
    const val = parseFloat(inputVal)
    if (isNaN(val) || !player) return
    setSubmitting(true)
    await onSubmit(ch.id, player.id, val)
    setInputVal('')
    setSubmitting(false)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)' }}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-semibold text-slate-200 text-sm">🐺 {ch.label}</p>
            <p className="text-xs text-slate-500">{ch.desc} · Points game</p>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full ml-2 shrink-0"
            style={{ background: 'rgba(255,215,0,0.1)', color: '#b8860b', border: '1px solid rgba(255,215,0,0.2)' }}
          >
            {ch.prize}
          </span>
        </div>

        {/* Rules toggle */}
        <button
          onClick={() => setRulesOpen(o => !o)}
          className="text-[10px] text-yellow-500/70 underline underline-offset-2 mt-1"
        >
          {rulesOpen ? 'Hide rules ▲' : 'How to play ▼'}
        </button>
      </div>

      {/* Rules accordion */}
      {rulesOpen && (
        <div
          className="px-4 pb-4 space-y-3 border-b border-white/5"
          style={{ background: 'rgba(255,215,0,0.03)' }}
        >
          {WOLF_RULES.map(r => (
            <div key={r.title} className="flex gap-2.5">
              <span className="text-base shrink-0 mt-0.5">{r.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-300">{r.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="px-4 pt-3 pb-3">
        {leader ? (
          <>
            <div
              className="flex items-center gap-2 p-2 rounded-xl mb-2"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.1)' }}
            >
              <span className="text-yellow-400 text-sm">🥇</span>
              <span className="text-xs text-yellow-400 font-medium flex-1">
                {leader.players?.name || 'Unknown'}
              </span>
              <span className="text-xs text-slate-400">{leader.value} pts</span>
            </div>
            {sorted.length > 1 && (
              <div className="space-y-1 mb-2">
                {sorted.slice(1).map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-600 w-3">{i + 2}</span>
                    <span className="flex-1">{r.players?.name || 'Unknown'}</span>
                    <span>{r.value} pts</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[11px] text-slate-600 mb-2 italic">No points submitted yet</p>
        )}

        {/* Submit */}
        {player && isConfigured && (
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              step="1"
              placeholder="Your net pts…"
              className="flex-1 px-3 py-1.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || inputVal === ''}
              className="btn-gold py-1.5 px-4 text-sm disabled:opacity-40"
            >
              {submitting ? '…' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ChallengeCard({ ch, results, player, onSubmit }) {
  const [inputVal, setInputVal] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Get results for this challenge
  const myResults = results.filter(r => r.challenge_id === ch.id)
  // Sort by value (lower is better for CTP, higher for LD)
  const sorted = [...myResults].sort((a, b) =>
    ch.lower ? a.value - b.value : b.value - a.value
  )
  const leader = sorted[0]

  const handleSubmit = async () => {
    const val = parseFloat(inputVal)
    if (!val || val <= 0 || !player) return
    setSubmitting(true)
    await onSubmit(ch.id, player.id, val)
    setInputVal('')
    setSubmitting(false)
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-slate-200 text-sm">{ch.label}</p>
          <p className="text-xs text-slate-500">{ch.desc}</p>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full ml-2 shrink-0"
          style={{ background: 'rgba(255,215,0,0.1)', color: '#b8860b', border: '1px solid rgba(255,215,0,0.2)' }}
        >
          {ch.prize}
        </span>
      </div>

      {/* Current leader */}
      {leader && (
        <div
          className="flex items-center gap-2 p-2 rounded-xl mb-3"
          style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.1)' }}
        >
          <span className="text-yellow-400 text-sm">🥇</span>
          <span className="text-xs text-yellow-400 font-medium flex-1">
            {leader.players?.name || 'Unknown'}
          </span>
          <span className="text-xs text-slate-400">
            {leader.value} {ch.metric}
          </span>
        </div>
      )}

      {/* All entries */}
      {sorted.length > 1 && (
        <div className="space-y-1 mb-3">
          {sorted.slice(1).map((r, i) => (
            <div key={r.id} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-slate-600 w-3">{i + 2}</span>
              <span className="flex-1">{r.players?.name || 'Unknown'}</span>
              <span>{r.value} {ch.metric}</span>
            </div>
          ))}
        </div>
      )}

      {/* Submit form (only for challenges with metric) */}
      {ch.metric && player && isConfigured && (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder={`Enter ${ch.metric}…`}
            className="flex-1 px-3 py-1.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !inputVal}
            className="btn-gold py-1.5 px-4 text-sm disabled:opacity-40"
          >
            {submitting ? '…' : 'Submit'}
          </button>
        </div>
      )}

      {!ch.metric && (
        <p className="text-xs text-slate-600 italic">Tracked automatically from scores</p>
      )}
    </div>
  )
}

export default function Challenges() {
  const { player } = useAuth()
  const [results, setResults] = useState([])

  const load = () => {
    fetchChallengeResults().then(data => setResults(data))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (challengeId, playerId, value) => {
    await insertChallengeResult(challengeId, playerId, value)
    load()
  }

  return (
    <div className="p-4 pb-6">
      <div className="mb-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Side Games</p>
        <h1 className="page-title mt-0.5">Challenges</h1>
      </div>

      {/* Info banner */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <p className="text-sm text-slate-300 font-medium mb-1">🎯 Tournament Side Challenges</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Compete in these special challenges throughout the tournament. Prizes and bragging rights for winners!
        </p>
      </div>

      {!isConfigured && (
        <div
          className="rounded-xl p-3 mb-4 text-xs text-center"
          style={{ background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.2)', color: '#b8860b' }}
        >
          ⚠️ Connect Supabase to enable challenge submissions and see live results
        </div>
      )}

      {/* Challenge cards */}
      <div className="space-y-3">
        {CHALLENGES.map(ch => ch.id === 'wolf' ? (
          <WolfCard
            key={ch.id}
            ch={ch}
            results={results}
            player={player}
            onSubmit={handleSubmit}
          />
        ) : (
          <ChallengeCard
            key={ch.id}
            ch={ch}
            results={results}
            player={player}
            onSubmit={handleSubmit}
          />
        ))}
      </div>

      {/* Notification info */}
      <div
        className="mt-5 rounded-2xl p-4 text-center"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs text-slate-500 leading-relaxed">
          🔔 Birdie & Eagle notifications appear live at the top of the app as players enter scores
        </p>
      </div>
    </div>
  )
}
