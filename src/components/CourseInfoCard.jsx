import { useState } from 'react'

// Tee colour → CSS colour (best-effort mapping)
const TEE_COLORS = {
  black:       '#1a1a1a',
  blue:        '#3b82f6',
  white:       '#e2e8f0',
  gold:        '#FFD700',
  yellow:      '#facc15',
  red:         '#ef4444',
  green:       '#22c55e',
  silver:      '#94a3b8',
  championship:'#7c3aed',
}

function teeColor(name = '') {
  const key = name.toLowerCase().split(' ')[0]
  return TEE_COLORS[key] ?? '#94a3b8'
}

/** Horizontal scorecard rows (scrollable) */
function Scorecard({ holes }) {
  if (!holes?.length) return null

  const front = holes.slice(0, 9)
  const back  = holes.slice(9, 18)

  const sum = (arr, key) => arr.reduce((s, h) => s + (h[key] ?? 0), 0)

  const colStyle = { minWidth: 28, textAlign: 'center', padding: '4px 2px', fontSize: 11 }
  const labelStyle = { ...colStyle, textAlign: 'left', minWidth: 36, fontWeight: 600, color: '#94a3b8', fontSize: 10 }
  const subStyle  = { ...colStyle, background: 'rgba(255,215,0,0.08)', color: '#b8860b', fontWeight: 600 }
  const totStyle  = { ...colStyle, background: 'rgba(255,215,0,0.15)', color: '#FFD700', fontWeight: 700 }

  const Row = ({ label, holes: holeArr, getValue, subtotal, total }) => (
    <tr>
      <td style={labelStyle}>{label}</td>
      {holeArr.map(h => (
        <td key={h.number} style={colStyle}>{getValue(h)}</td>
      ))}
      {subtotal !== undefined && <td style={subStyle}>{subtotal}</td>}
      {back.length === 0 && total !== undefined && <td style={totStyle}>{total}</td>}
    </tr>
  )

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-1">
      <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: 11, color: '#e2e8f0' }}>
        <thead>
          {/* Front 9 */}
          <tr>
            <th style={labelStyle}>Hole</th>
            {front.map(h => <th key={h.number} style={colStyle}>{h.number}</th>)}
            <th style={subStyle}>OUT</th>
            {back.length === 0 && <th style={totStyle}>TOT</th>}
          </tr>
        </thead>
        <tbody>
          <Row
            label="Par"
            holes={front}
            getValue={h => h.par}
            subtotal={sum(front, 'par')}
            total={sum(holes, 'par')}
          />
          <Row
            label="Yds"
            holes={front}
            getValue={h => h.yards}
            subtotal={sum(front, 'yards')}
            total={sum(holes, 'yards')}
          />
          <Row
            label="HCP"
            holes={front}
            getValue={h => h.si ?? '—'}
            subtotal=""
            total=""
          />
        </tbody>

        {back.length > 0 && (
          <>
            <thead>
              <tr>
                <th style={labelStyle}>Hole</th>
                {back.map(h => <th key={h.number} style={colStyle}>{h.number}</th>)}
                <th style={subStyle}>IN</th>
                <th style={totStyle}>TOT</th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="Par"
                holes={back}
                getValue={h => h.par}
                subtotal={sum(back, 'par')}
                total={sum(holes, 'par')}
              />
              <Row
                label="Yds"
                holes={back}
                getValue={h => h.yards}
                subtotal={sum(back, 'yards')}
                total={sum(holes, 'yards')}
              />
              <Row
                label="HCP"
                holes={back}
                getValue={h => h.si ?? '—'}
                subtotal=""
                total=""
              />
            </tbody>
          </>
        )}
      </table>
    </div>
  )
}

/**
 * CourseInfoCard — reusable course display.
 *
 * Props:
 *   course      — Supabase row with `.data` (full GolfCourseAPI response)
 *   tees        — extracted tee array from useCourse / extractTees
 *   selectedTee — currently active tee name
 *   onTeeChange — (teeName) => void  — called when user picks a different tee
 *   compact     — boolean — show summary only (no scorecard)
 */
export default function CourseInfoCard({ course, tees = [], selectedTee, onTeeChange, compact = false }) {
  const [localTee, setLocalTee] = useState(selectedTee ?? tees[0]?.name ?? null)

  if (!course?.data) return null

  const d     = course.data
  const name  = d.club_name || d.course_name || course.name || 'Golf Course'
  const city  = d.location?.city  ?? d.city  ?? ''
  const state = d.location?.state ?? d.state ?? ''
  const country = d.location?.country ?? d.country ?? ''
  const address = d.location?.address ?? d.address ?? ''
  const phone   = d.phone   ?? null
  const website = d.website ?? null
  const lat     = d.latitude  ?? null
  const lng     = d.longitude ?? null

  const activeTee = tees.find(t => t.name === localTee) ?? tees[0]

  const amenities = [
    d.has_driving_range  && '🏌️ Driving Range',
    d.has_pro_shop       && '🛍️ Pro Shop',
    d.has_restaurant     && '🍽️ Restaurant',
    d.has_putting_green  && '⛳ Putting Green',
    d.has_chipping_green && '🏌️ Chipping Green',
    d.has_golf_carts     && '🚗 Golf Carts',
    d.has_bar            && '🍺 Bar',
    d.has_locker_room    && '🔐 Locker Room',
  ].filter(Boolean)

  const handleTeeChange = (name) => {
    setLocalTee(name)
    onTeeChange?.(name)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,215,0,0.1)' }}
      >
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">⛳ Course</p>
        <p className="font-serif text-lg font-bold gold-text leading-snug">{name}</p>
        {(city || state) && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span>📍</span>
            {[city, state, country].filter(Boolean).join(', ')}
          </p>
        )}
        {!compact && address && (
          <p className="text-xs text-slate-500 mt-0.5 pl-4">{address}</p>
        )}
        {!compact && (phone || website) && (
          <div className="flex flex-wrap gap-x-4 mt-1.5 pl-0">
            {phone && <p className="text-xs text-slate-400">📞 {phone}</p>}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-yellow-400 underline underline-offset-2">
                🌐 Website
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tee selector */}
      {tees.length > 0 && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Select Tee</p>
          <div className="flex flex-wrap gap-2">
            {tees.map(t => (
              <button
                key={t.name}
                onClick={() => handleTeeChange(t.name)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: localTee === t.name ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${localTee === t.name ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                  color: localTee === t.name ? '#FFD700' : '#94a3b8',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: teeColor(t.name), border: '1px solid rgba(255,255,255,0.2)' }}
                />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats for selected tee */}
      {activeTee && (
        <div className="px-4 py-3 flex gap-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Par</p>
            <p className="font-serif text-xl font-bold text-slate-200">{activeTee.par}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Yards</p>
            <p className="font-serif text-xl font-bold text-slate-200">{activeTee.yardage?.toLocaleString()}</p>
          </div>
          {activeTee.slope && (
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Slope</p>
              <p className="font-serif text-xl font-bold text-slate-200">{activeTee.slope}</p>
            </div>
          )}
          {activeTee.rating && (
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</p>
              <p className="font-serif text-xl font-bold text-slate-200">{activeTee.rating}</p>
            </div>
          )}
        </div>
      )}

      {/* Scorecard */}
      {!compact && activeTee?.holes?.length > 0 && (
        <div className="px-2 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest px-2 mb-2">Scorecard</p>
          <Scorecard holes={activeTee.holes} />
        </div>
      )}

      {/* Amenities */}
      {!compact && amenities.length > 0 && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {amenities.map(a => (
              <span key={a} className="text-xs text-slate-300 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Map link */}
      {!compact && lat && lng && (
        <div className="px-4 py-3">
          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full py-2 text-sm flex items-center justify-center gap-2"
          >
            🗺️ View on Map
          </a>
        </div>
      )}
    </div>
  )
}
