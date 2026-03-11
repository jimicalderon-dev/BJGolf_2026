import { useState, useEffect, useCallback } from 'react'
import { supabase, fetchScores } from '../lib/supabase'

/**
 * Real-time scores hook for a single event.
 * Returns { scores, loading, refetch }
 * scores shape: { [player_id]: { [hole_number]: strokes } }
 */
export function useScores(eventId) {
  const [scores,  setScores]  = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!eventId) { setLoading(false); return }
    setLoading(true)
    const data = await fetchScores(eventId)
    setScores(data)
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    load()
    if (!supabase || !eventId) return

    const channel = supabase
      .channel(`scores-${eventId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (!payload.new) return
          const { player_id, hole_number, strokes } = payload.new
          setScores(prev => ({
            ...prev,
            [player_id]: { ...(prev[player_id] ?? {}), [hole_number]: strokes },
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, load])

  return { scores, loading, refetch: load }
}
