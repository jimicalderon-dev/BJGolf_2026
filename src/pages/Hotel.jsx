const HOTEL = {
  name:    'Las Colinas Golf & Country Club Resort',
  address: 'Calle Las Colinas 123, Golf District',
  checkin:  'Thu Jun 18, 2026 · from 15:00',
  checkout: 'Mon Jun 22, 2026 · until 12:00',
  amenities: [
    { icon: '🏊', label: 'Pool & Spa'          },
    { icon: '⛳', label: 'Driving Range'        },
    { icon: '🛍️', label: 'Pro Shop'            },
    { icon: '🍽️', label: 'Restaurant & Bar'    },
    { icon: '🏋️', label: 'Gym'                 },
    { icon: '🚗', label: 'Golf Cart Fleet'      },
    { icon: '📶', label: 'High-Speed WiFi'      },
    { icon: '🌿', label: 'Championship Course'  },
  ],
}

const ROOMS = [
  { suite: 'Suite 101', players: ['Carlos M.',    'Diego R.']      },
  { suite: 'Suite 102', players: ['Andrés P.',    'Sebastián L.']  },
  { suite: 'Suite 103', players: ['Ricardo F.',   'Martín G.']     },
  { suite: 'Suite 104', players: ['Javier H.',    'Pablo S.']      },
  { suite: 'Suite 105', players: ['Fernando T.',  'Alejandro V.']  },
]

export default function Hotel() {
  return (
    <div className="p-4 pb-6 space-y-4">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Accommodation</p>
        <h1 className="page-title mt-0.5">Hotel</h1>
      </div>

      {/* Resort card */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}
      >
        <div className="text-5xl mb-3">🏨</div>
        <h2 className="font-serif text-lg font-bold gold-text leading-tight">{HOTEL.name}</h2>
        <p className="text-xs text-slate-500 mt-1">{HOTEL.address}</p>

        <div className="mt-4 space-y-2 text-left">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Check-in</span>
            <span className="text-sm font-medium text-slate-200">{HOTEL.checkin}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Check-out</span>
            <span className="text-sm font-medium text-slate-200">{HOTEL.checkout}</span>
          </div>
        </div>
      </div>

      {/* Room assignments */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">🛏️ Room Assignments</p>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map(room => (
            <div
              key={room.suite}
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}
            >
              <p className="font-serif text-yellow-400/80 text-xs mb-2">{room.suite}</p>
              {room.players.map(name => (
                <p key={name} className="text-xs text-slate-300 leading-relaxed">{name}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">✨ Amenities</p>
        <div className="grid grid-cols-2 gap-2">
          {HOTEL.amenities.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-lg">{a.icon}</span>
              <span className="text-xs text-slate-300">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">💡 Travel Tips</p>
        <div className="space-y-3">
          {[
            { tip: '☀️ Weather',    desc: 'Warm sunny days. Sunscreen & hydration essential on the course.' },
            { tip: '👟 Dress Code', desc: 'Collared shirts required on course. Soft spikes only.' },
            { tip: '⛳ Tee Times',  desc: 'Arrive 30 min before your tee time. Warm up at the range.' },
            { tip: '🍺 19th Hole',  desc: 'Resort bar open until midnight. Round recap tradition!' },
          ].map(({ tip, desc }) => (
            <div key={tip} className="pb-3 border-b border-white/5 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-yellow-400">{tip}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
