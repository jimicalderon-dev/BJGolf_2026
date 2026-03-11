import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../hooks/useChat'
import { isConfigured } from '../lib/supabase'

function timeFmt(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function dateFmt(ts) {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Chat() {
  const { player } = useAuth()
  const { messages, loading, send } = useChat()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !player || sending) return
    setSending(true)
    setInput('')
    await send(player.id, text)
    setSending(false)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Real-time</p>
        <div className="flex items-center justify-between">
          <h1 className="page-title mt-0.5">Group Chat</h1>
          {isConfigured ? (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">● Live</span>
          ) : (
            <span className="text-[10px] bg-white/5 text-slate-600 px-2 py-0.5 rounded-full">○ Offline</span>
          )}
        </div>
        {player && (
          <p className="text-xs text-slate-500 mt-1">
            Chatting as <span className="text-yellow-400">{player.name}</span>
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {loading && (
          <div className="text-center text-slate-500 text-sm py-8">Loading messages…</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-30">💬</div>
            <p className="text-slate-500 text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs mt-1">Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const sender    = msg.players || {}
          const senderName = sender.name || 'Unknown'
          const isMe       = msg.player_id === player?.id
          const teamColor  = sender.team === 'A' ? 'text-green-400' : 'text-blue-400'
          const avatarCls  = sender.team === 'A' ? 'avatar-a' : 'avatar-b'
          const ts         = msg.created_at
          const prevMsg    = messages[i - 1]
          const showDate   = i === 0 || dateFmt(prevMsg?.created_at) !== dateFmt(ts)

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-[10px] text-slate-600 my-2">— {dateFmt(ts)} —</div>
              )}
              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className={`avatar ${avatarCls} shrink-0`} style={{ width: 28, height: 28, fontSize: 9 }}>
                    {sender.avatar || '?'}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <p className={`text-[10px] ${teamColor} mb-0.5 ml-1`}>{senderName}</p>
                  )}
                  <div
                    className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: isMe
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.15))'
                        : 'rgba(255,255,255,0.08)',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      color: '#e2e8f0',
                    }}
                  >
                    {msg.message}
                  </div>
                  <p className={`text-[9px] text-slate-600 mt-0.5 ${isMe ? 'mr-1 text-right' : 'ml-1'}`}>
                    {timeFmt(ts)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t border-white/5 shrink-0 flex gap-2 items-center"
        style={{ background: 'rgba(6,14,6,0.8)', backdropFilter: 'blur(10px)' }}
      >
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
          placeholder={player ? 'Message the group…' : 'Log in to chat'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={!player || !isConfigured}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !player || sending || !isConfigured}
          className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-lg transition-all active:scale-90 shrink-0 disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #FFD700, #b8860b)' }}
        >
          {sending ? '…' : '→'}
        </button>
      </div>
    </div>
  )
}
