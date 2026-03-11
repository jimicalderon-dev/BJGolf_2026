import { useState, useEffect, useCallback } from 'react'
import { supabase, fetchMessages, insertMessage } from '../lib/supabase'

/**
 * Real-time chat hook.
 * Returns { messages, loading, send(playerId, text) }
 */
export function useChat() {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    const data = await fetchMessages()
    setMessages(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    if (!supabase) return

    const channel = supabase
      .channel(`chat-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async () => {
          // Refetch to get the joined player data
          const data = await fetchMessages()
          setMessages(data)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  const send = useCallback(async (playerId, message) => {
    const trimmed = message.trim()
    if (!trimmed) return null
    return insertMessage(playerId, trimmed)
  }, [])

  return { messages, loading, send }
}
