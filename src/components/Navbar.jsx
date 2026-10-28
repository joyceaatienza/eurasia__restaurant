import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { User, Receipt, X } from 'lucide-react'
import logo from '../assets/logoword.png'
import logoPic from '../assets/logopic3.png'
import trayIcon from '../assets/tray-icon.png'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotifBell'
import { useCustomerNotifications } from '../hooks/CustomerNotif'

// Shown once per login, so it reminds without nagging on every page
const BALANCE_SEEN_KEY = 'eurasia_balance_notice_seen'

const peso = (n) =>
  `₱ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* Big reminder when the customer still has an unpaid bill — they can keep
   ordering, this just makes sure the balance isn't forgotten */
function BalanceNotice({ count, total, onSettle, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-neutral-400 hover:text-[#1d080f]"
        >
          <X size={18} />
        </button>

        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
          <Receipt size={30} />
        </div>
        <h3 className="font-heading text-xl text-[#1d080f] mb-2">You have an unpaid bill</h3>
        <p className="font-heading text-3xl text-[#1d080f] mb-2">{peso(total)}</p>
        <p className="text-sm text-neutral-600 leading-relaxed mb-6">
          From {count} order{count !== 1 ? 's' : ''} that {count !== 1 ? "haven't" : "hasn't"} been settled yet.
          You can still order more — just remember to settle your bill before you leave.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onSettle}
            className="w-full bg-[#2e5a2e] text-white font-heading font-bold py-3 rounded-xl hover:bg-[#244724] transition"
          >
            Settle Bill Now
          </button>
          <button
            onClick={onClose}
            className="w-full border border-neutral-300 text-neutral-700 font-heading py-3 rounded-xl hover:bg-neutral-50 transition"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount, openTray, trayIconRef } = useCart()
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // One source for both the desktop and the mobile bell
  const notif = useCustomerNotifications()

  // Unpaid-balance reminder: once per login, only after fresh data has loaded
  const [showBalance, setShowBalance] = useState(false)

  // Logging out resets the reminder, so it shows again on the next login
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.removeItem(BALANCE_SEEN_KEY)
      setShowBalance(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !notif.unpaidLoaded || notif.unpaidCount === 0) return
    if (sessionStorage.getItem(BALANCE_SEEN_KEY)) return
    sessionStorage.setItem(BALANCE_SEEN_KEY, '1')
    setShowBalance(true)
  }, [isAuthenticated, notif.unpaidLoaded, notif.unpaidCount])

  const goSettle = () => {
    setShowBalance(false)
    navigate('/payment', { state: { openSettle: true, at: Date.now() } })
  }

  // Hide the wordmark on the auth pages — the big logo is already on the page
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  // Send guests to login, logged-in customers to their account
  const accountPath = isAuthenticated ? '/account' : '/login'

  const linkClass = ({ isActive }) =>
    isActive
      ? 'font-bold text-[#1d080f] [-webkit-text-stroke:0.4px_#1d080f]'
      : 'hover:text-[#1d080f]'

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-xl">
      <div className="flex items-center justify-between px-6 md:px-10 py-4">
        {isAuthPage ? (
          <span className="h-12" />
        ) : (
          <NavLink to="/" className="flex items-center">
            <img src={logoPic} alt="" className="h-13 w-auto" />
            <img src={logo} alt="Eurasia Restaurant" className="h-11 w-auto" />
          </NavLink>
        )}

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-[#1d080f] font-heading">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/menu" className={linkClass}>Menu</NavLink>
          <NavLink to="/reservation" className={linkClass}>Reservation</NavLink>
          <NavLink to="/payment" className={linkClass}>Order</NavLink>
          <NavLink to="/about" className={linkClass}>About Us</NavLink>

          <NavLink to={accountPath} aria-label="Account" title="Account" className={({ isActive }) => (isActive ? 'text-[#1d080f]' : 'hover:opacity-70')}>
            <User className="h-7 w-7" strokeWidth={1.75} />
          </NavLink>

          <button ref={trayIconRef} onClick={openTray} className="hover:opacity-70 relative">
            <img src={trayIcon} alt="Tray" className="h-11 w-auto" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {/* Only logged-in customers have orders and reservations to hear about */}
          {isAuthenticated && <NotificationBell {...notif} />}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={openTray} className="hover:opacity-70 relative">
            <img src={trayIcon} alt="Tray" className="h-11 w-auto" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          {isAuthenticated && <NotificationBell {...notif} iconClass="h-6 w-6" />}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-neutral-900">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-6 py-4 flex flex-col gap-4 font-heading text-[#1d080f]">
          <NavLink to="/" end onClick={() => setMobileOpen(false)} className={linkClass}>Home</NavLink>
          <NavLink to="/menu" onClick={() => setMobileOpen(false)} className={linkClass}>Menu</NavLink>
          <NavLink to="/reservation" onClick={() => setMobileOpen(false)} className={linkClass}>Reservation</NavLink>
          <NavLink to="/payment" onClick={() => setMobileOpen(false)} className={linkClass}>Order</NavLink>
          <NavLink to="/about" onClick={() => setMobileOpen(false)} className={linkClass}>About Us</NavLink>
          <NavLink to={accountPath} onClick={() => setMobileOpen(false)} className={linkClass}>
            <span className="inline-flex items-center gap-2"><User className="h-5 w-5" strokeWidth={1.75} /> Account</span>
          </NavLink>
        </div>
      )}

      {showBalance && (
        <BalanceNotice
          count={notif.unpaidCount}
          total={notif.unpaidTotal}
          onSettle={goSettle}
          onClose={() => setShowBalance(false)}
        />
      )}
    </nav>
  )
}

export default Navbar