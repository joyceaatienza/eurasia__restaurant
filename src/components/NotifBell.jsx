import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, UtensilsCrossed, CalendarCheck2, Wallet } from 'lucide-react'

const KIND_ICON = {
  order: UtensilsCrossed,
  reservation: CalendarCheck2,
  payment: Wallet,
}

const TONE_CLASS = {
  success: 'bg-[#e6f4ea] text-[#296c39]',
  error: 'bg-[#fbeaea] text-[#c53a3a]',
  info: 'bg-[#f5e9d8] text-[#8a6228]',
}

function timeAgo(value) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// The data comes from useCustomerNotifications in the Navbar, so the
// desktop and mobile bells share one source instead of polling twice
export default function NotificationBell({ notifications, readIds, unreadCount, markRead, iconClass = 'h-7 w-7' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openItem = (n) => {
    markRead([n.id])
    setOpen(false)
    // Tell the page which item to jump to; `at` makes a repeat tap on the same page still work
    navigate(n.link, { state: { highlight: n.target, at: Date.now() } })
  }

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        title="Notifications"
        className="relative hover:opacity-70 text-[#1d080f] flex items-center"
      >
        <Bell className={iconClass} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Pinned under the navbar on phones so it never runs off the screen */}
      {open && (
        <div className="fixed inset-x-4 top-[88px] md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-4 md:w-[360px] max-h-[min(460px,70vh)] bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col z-[60] text-left">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <span className="font-heading text-base text-[#1d080f]">Notifications</span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markRead(notifications.map((n) => n.id))}
                  className="text-xs font-bold text-[#8a6228] hover:underline whitespace-nowrap"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-neutral-500 hover:text-[#1d080f]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-neutral-500">
                No updates yet. We'll let you know when your order, reservation or payment changes.
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = KIND_ICON[n.kind]
                const unread = !readIds.includes(n.id)
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`w-full flex items-start gap-3 px-5 py-3.5 border-b border-neutral-100 last:border-0 text-left transition hover:bg-[#f0eff3] ${
                      unread ? 'bg-[#fffdf7]' : 'bg-white'
                    }`}
                  >
                    <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${TONE_CLASS[n.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 font-heading text-sm text-[#1d080f]">
                        {n.title}
                        {unread && <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />}
                      </span>
                      <span className="block text-xs text-neutral-600 mt-0.5 leading-relaxed">{n.detail}</span>
                      <span className="block text-[11px] text-neutral-400 mt-1">{timeAgo(n.at)}</span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}