import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchPhotos, uploadPhoto } from '../lib/supabase'
import { isConfigured } from '../lib/supabase'

const DAY_TABS = [
  { label: 'All',   val: null },
  { label: 'Day 0', val: 0    },
  { label: 'Day 1', val: 1    },
  { label: 'Day 2', val: 2    },
  { label: 'Day 3', val: 3    },
]

export default function Gallery() {
  const { player } = useAuth()
  const [photos,   setPhotos]   = useState([])
  const [dayFilter, setDayFilter] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [caption,   setCaption]  = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const fileRef = useRef()

  const load = () => {
    fetchPhotos(dayFilter).then(data => setPhotos(data))
  }

  useEffect(() => { load() }, [dayFilter])

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file || !player) return
    setUploading(true)
    const day = dayFilter ?? 0
    await uploadPhoto(file, player.id, caption, day)
    setCaption('')
    setShowUpload(false)
    load()
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="p-4 pb-6">
      <div className="mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Trip Memories</p>
        <h1 className="page-title mt-0.5">Gallery</h1>
      </div>

      {/* Day filter + upload */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
          {DAY_TABS.map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setDayFilter(val)}
              className={`pill shrink-0 text-xs py-1 px-3 ${dayFilter === val ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        {player && isConfigured && (
          <button
            onClick={() => setShowUpload(v => !v)}
            className="btn-gold py-1.5 px-4 text-sm shrink-0"
          >
            📸 Upload
          </button>
        )}
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="glass rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">Upload a photo</p>
          <input
            type="text"
            placeholder="Caption (optional)"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-gold w-full py-2.5 text-sm justify-center"
          >
            {uploading ? 'Uploading…' : '📁 Choose Photo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          {!isConfigured && (
            <p className="text-xs text-slate-600 text-center">Connect Supabase to enable photo uploads</p>
          )}
        </div>
      )}

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3 opacity-30">📸</div>
          <p className="text-slate-500 text-sm">No photos yet</p>
          <p className="text-slate-600 text-xs mt-1">
            {isConfigured ? 'Tap "Upload" to add your first shot!' : 'Connect Supabase to enable photos'}
          </p>
          {/* Placeholder grid */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {['⛳', '🏌️', '🏆', '🌿', '🏊', '🍺'][i]}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer relative"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => setLightbox(photo)}
            >
              <img
                src={photo.image_url}
                alt={photo.caption || 'Golf photo'}
                className="w-full h-full object-cover"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/60 text-[9px] text-white/80 truncate">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/92"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.image_url}
            alt={lightbox.caption || 'Photo'}
            className="max-w-full max-h-[75vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <div className="mt-3 text-center" onClick={e => e.stopPropagation()}>
            {lightbox.caption && <p className="text-white/80 text-sm">{lightbox.caption}</p>}
            <p className="text-white/40 text-xs mt-1">
              {lightbox.players?.name} · Day {lightbox.day}
            </p>
            <button
              className="btn-outline mt-3 text-sm"
              onClick={() => setLightbox(null)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
