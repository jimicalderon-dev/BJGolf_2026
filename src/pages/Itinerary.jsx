import { ITINERARY, TOURNAMENT_CONFIG } from '../constants/course'
import { CountdownBadge } from '../components/Countdown'

const ACTIVITY_EVENT_MAP = [
  { keywords: ['Individual Stroke Play'], eventId: 'ind' },
  { keywords: ['Best Ball'],              eventId: 'bb'  },
  { keywords: ['Scramble'],               eventId: 'scr' },
  { keywords: ['Alternate Shot'],         eventId: 'alt' },
  { keywords: ['Ryder Cup Singles'],      eventId: 'rc'  },
]

const EVENT_STARTS = Object.fromEntries(
  TOURNAMENT_CONFIG.events.map(e => [e.id, e.start])
)

function getEventStart(actDesc) {
  const match = ACTIVITY_EVENT_MAP.find(({ keywords }) =>
    keywords.some(kw => actDesc.includes(kw))
  )
  return match ? EVENT_STARTS[match.eventId] : null
}

function ActivityBadge({ desc }) {
  const start = getEventStart(desc)
  if (!start) return null
  return <CountdownBadge targetDate={start} liveLabel="LIVE" />
}

export default function Itinerary() {
  return (
    <div className="p-4 pb-6">
      <div className="mb-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Jun 18–22, 2026</p>
        <h1 className="page-title mt-0.5">Trip Schedule</h1>
      </div>

      <div className="space-y-6">
        {ITINERARY.map((day) => (
          <div key={day.day}>
            {/* Day header */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #FFD700, #b8860b)' }}
              >
                {day.day}
              </div>
              <div>
                <p className="font-serif text-base font-semibold gold-text">{day.label}</p>
                <p className="text-[10px] text-slate-500">{day.date}</p>
              </div>
            </div>

            {/* Activities */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {day.activities.map((act, ai) => (
                <div
                  key={ai}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    ai < day.activities.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                    <div className="text-xl">{act.emoji}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="text-sm font-medium text-slate-200">{act.desc}</p>
                      <ActivityBadge desc={act.desc} />
                    </div>
                    <p className="text-xs text-yellow-400/70 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        className="mt-6 rounded-2xl p-4 text-center"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <div className="text-3xl mb-2">⛳</div>
        <p className="font-serif text-base text-yellow-400 mb-1">Las Colinas Awaits</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Schedule subject to change. Check back for updates!
        </p>
      </div>
    </div>
  )
}
