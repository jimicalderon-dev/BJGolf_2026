import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchPlayers, verifyPin } from '../lib/supabase'

const AuthContext = createContext(null)
const STORAGE_KEY = 'bj2026_player'

export function AuthProvider({ children }) {
  const [player, setPlayer] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [players, setPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  useEffect(() => {
    fetchPlayers().then(data => {
      setPlayers(data)
      setLoadingPlayers(false)
      // Refresh stored player object in case DB changed
      if (player) {
        const fresh = data.find(p => p.id === player.id)
        if (fresh) { setPlayer(fresh); localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)) }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (playerId, pin) => {
    const result = await verifyPin(playerId, pin)
    if (!result.success) return { error: result.error }
    setPlayer(result.player)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.player))
    return { error: null }
  }, [])

  const logout = useCallback(() => {
    setPlayer(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ player, players, loadingPlayers, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
