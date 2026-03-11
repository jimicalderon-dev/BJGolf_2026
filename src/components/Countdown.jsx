import { useState, useEffect, useRef } from 'react'

function pad(n) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function calcTimeLeft(targetDate) {
  const diff = new Date(targetDate) - new Date()
  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', isExpired: true, totalMs: 0 }
  }
  return {
    days:      pad(Math.floor(diff / 86_400_000)),
    hours:     pad(Math.floor((diff % 86_400_000) / 3_600_000)),
    minutes:   pad(Math.floor((diff % 3_600_000) / 60_000)),
    seconds:   pad(Math.floor((diff % 60_000) / 1_000)),
    isExpired: false,
    totalMs:   diff,
  }
}

/** Single animated time box */
function TimeBox({ value, unit }) {
  const prevRef = useRef(value)
  const key = value !== prevRef.current ? value : undefined
  prevRef.current = value
  return (
    <div
      className="flex flex-col items-center"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,215,0,0.15)',
        borderRadius: 12,
        minWidth: 52,
        padding: '8px 10px 6px',
      }}
    >
      <span
        key={key}
        className="countdown-digit font-serif font-bold leading-none"
        style={{ fontSize: 32, color: '#FFD700' }}
      >
        {value}
      </span>
      <span
        className="uppercase tracking-widest"
        style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, letterSpacing: '0.15em' }}
      >
        {unit}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <span
      className="countdown-colon font-bold self-start"
      style={{ color: '#FFD700', fontSize: 26, paddingTop: 10 }}
    >
      :
    </span>
  )
}

/**
 * Reusable countdown component.
 *
 * Props:
 *   targetDate  — ISO date string or Date
 *   label       — uppercase label shown above (e.g. "TRIP STARTS IN")
 *   onExpire    — optional callback when countdown reaches zero
 */
export default function Countdown({ targetDate, label, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate))
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    setTimeLeft(calcTimeLeft(targetDate))
    const id = setInterval(() => {
      const t = calcTimeLeft(targetDate)
      setTimeLeft(t)
      if (t.isExpired && !firedRef.current) {
        firedRef.current = true
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [targetDate]) // eslint-disable-line react-hooks/exhaustive-deps

  if (timeLeft.isExpired) return null

  return (
    <div>
      {label && (
        <p
          className="text-center mb-3 tracking-widest uppercase"
          style={{ fontSize: 10, color: '#FFD700', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.3em' }}
        >
          {label}
        </p>
      )}
      <div className="flex items-center justify-center gap-1.5">
        <TimeBox value={timeLeft.days}    unit="Days" />
        <Colon />
        <TimeBox value={timeLeft.hours}   unit="Hrs" />
        <Colon />
        <TimeBox value={timeLeft.minutes} unit="Min" />
        <Colon />
        <TimeBox value={timeLeft.seconds} unit="Sec" />
      </div>
    </div>
  )
}

/**
 * Small inline countdown badge — used on the Itinerary page.
 * Returns text like "2h 15m" or "45d" until the target.
 * Returns null when expired.
 */
export function CountdownBadge({ targetDate, liveLabel = 'LIVE' }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate))

  useEffect(() => {
    setTimeLeft(calcTimeLeft(targetDate))
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (timeLeft.isExpired) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <span className="live-dot w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        {liveLabel}
      </span>
    )
  }

  // Build compact label
  const d = parseInt(timeLeft.days,  10)
  const h = parseInt(timeLeft.hours, 10)
  const m = parseInt(timeLeft.minutes, 10)
  let text = ''
  if (d > 0)      text = `${d}d ${h}h`
  else if (h > 0) text = `${h}h ${m}m`
  else             text = `${m}m`

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: 'rgba(255,215,0,0.1)', color: '#b8860b', border: '1px solid rgba(255,215,0,0.2)' }}
    >
      ⏱ in {text}
    </span>
  )
}
