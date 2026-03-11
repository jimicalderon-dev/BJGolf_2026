import { NavLink } from 'react-router-dom'

const NAV = [
  { path: '/',           label: 'Home',      icon: '⛳' },
  { path: '/scores',     label: 'Scores',    icon: '📊' },
  { path: '/entry',      label: 'Enter',     icon: '✏️' },
  { path: '/teams',      label: 'Teams',     icon: '🏆' },
  { path: '/stats',      label: 'Stats',     icon: '📈' },
  { path: '/schedule',   label: 'Schedule',  icon: '📅' },
  { path: '/hotel',      label: 'Hotel',     icon: '🏨' },
  { path: '/gallery',    label: 'Gallery',   icon: '📸' },
  { path: '/chat',       label: 'Chat',      icon: '💬' },
  { path: '/challenges', label: 'Challenges',icon: '🎯' },
]

export default function BottomNav() {
  return (
    <nav
      className="flex-none border-t border-white/10 pb-safe"
      style={{ background: 'rgba(6,14,6,0.97)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex overflow-x-auto scrollbar-hide">
        {NAV.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[62px] py-2 px-1 text-[10px] font-medium transition-colors shrink-0 ${
                isActive ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <span className="text-[19px] mb-0.5 leading-none">{icon}</span>
            <span className="leading-none whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
