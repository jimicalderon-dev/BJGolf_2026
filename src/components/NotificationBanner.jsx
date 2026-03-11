import { useNotifications } from '../hooks/useNotifications'

export default function NotificationBanner() {
  const { notification, dismiss } = useNotifications()

  const isEagle  = notification?.type === 'eagle'
  const isBirdie = notification?.type === 'birdie'

  const gradientClass = isEagle
    ? 'from-yellow-500 to-amber-600 text-black'
    : isBirdie
    ? 'from-green-600 to-emerald-700 text-white'
    : 'from-blue-600 to-blue-700 text-white'

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        notification ? 'max-h-20' : 'max-h-0'
      }`}
    >
      {notification && (
        <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r ${gradientClass} animate-slide-down`}>
          <span className="font-semibold text-sm leading-snug flex-1">
            {notification.message}
          </span>
          <button
            onClick={dismiss}
            className="ml-3 text-xl leading-none opacity-70 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
