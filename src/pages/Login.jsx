import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isConfigured } from '../lib/supabase'

export default function Login() {
  const { players, loadingPlayers, login } = useAuth()
  const [selectedId, setSelectedId] = useState('')
  const [pin, setPin]               = useState('')
  const [error, setError]           = useState(null)
  const [busy, setBusy]             = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedId || pin.length !== 4) return
    setBusy(true)
    setError(null)
    const { error: err } = await login(selectedId, pin)
    if (err) { setError(err); setBusy(false) }
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #0a1a0a 0%, #0d1117 100%)' }}
    >
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 select-none">⛳</div>
        <h1 className="font-serif text-5xl font-bold gold-text">BJ 2026</h1>
        <p className="text-slate-500 text-xs tracking-widest uppercase mt-2">
          Las Colinas Golf & Country Club Resort
        </p>
      </div>

      {/* Card */}
      <div className="glass w-full max-w-sm p-6 rounded-2xl space-y-5">
        <h2 className="font-serif text-xl text-center text-slate-200">Sign In</h2>

        {!isConfigured && (
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs text-center leading-relaxed">
            ⚠️ Supabase not connected. Add your keys to .env and run{' '}
            <code className="font-mono">npm run dev</code> to enable login.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest">
              Player
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-yellow-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              required
              disabled={loadingPlayers}
            >
              <option value="">{loadingPlayers ? 'Loading players…' : 'Select your name…'}</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · Team {p.team} · HC {p.handicap}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-widest">
              PIN Code
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="• • • •"
              maxLength={4}
              className="w-full px-4 py-3 rounded-xl text-center text-2xl tracking-[0.5em] outline-none focus:ring-1 focus:ring-yellow-500/50"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-gold w-full py-3.5 text-base justify-center"
            disabled={busy || loadingPlayers || !selectedId || pin.length !== 4}
            style={{ opacity: (busy || !selectedId || pin.length !== 4) ? 0.5 : 1 }}
          >
            {busy ? 'Signing in…' : 'Sign In ⛳'}
          </button>
        </form>
      </div>

      <p className="text-slate-700 text-xs mt-8 text-center">
        Jun 18–22, 2026 · Las Colinas Golf & Country Club Resort
      </p>
    </div>
  )
}
