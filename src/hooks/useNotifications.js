import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Real-time notifications hook.
 * Returns { notification, dismiss }
 * notification: the latest inserted row from the notifications table, or null
 */
export function useNotifications() {
  const [notification, setNotification] = useState(null)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    setNotification(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel(`notifications-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotification(payload.new)
          // Clear any existing auto-dismiss timer
          if (timerRef.current) clearTimeout(timerRef.current)
          // Auto-dismiss after 5 seconds
          timerRef.current = setTimeout(() => setNotification(null), 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { notification, dismiss }
}
