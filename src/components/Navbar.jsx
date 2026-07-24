import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import logo from '../assets/logoword.png'
import trayIcon from '../assets/tray-icon.png'

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const location = useLocation()

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const linkClass = ({ isActive }) =>
    isActive
      ? 'font-bold text-[#1d080f] [-webkit-text-stroke:0.4px_#1d080f]'
      : 'hover:text-[#1d080f]'

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/50 shadow-none' : 'bg-white shadow-xl'}`}>
      <div className="flex items-center justify-between px-6 md:px-10 py-4">
        <NavLink to="/">
          <img src={logo} alt="Eurasia Restaurant" className="h-12 w-auto" />
        </NavLink>

        <div className="hidden md:flex items-center gap-8 text-[#1d080f] font-heading">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/menu" className={linkClass}>Menu</NavLink>
          <NavLink to="/reservation" className={linkClass}>Reservation</NavLink>
          <NavLink to="/payment" className={linkClass}>Payment</NavLink>
          <NavLink to="/about" className={linkClass}>About Us</NavLink>
          <NavLink to="/tray" className="hover:opacity-70">
            <img src={trayIcon} alt="Tray" className="h-11 w-auto" />
          </NavLink>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <NavLink to="/tray" className="hover:opacity-70">
            <img src={trayIcon} alt="Tray" className="h-11 w-auto" />
          </NavLink>
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
          <NavLink to="/payment" onClick={() => setMobileOpen(false)} className={linkClass}>Payment</NavLink>
          <NavLink to="/about" onClick={() => setMobileOpen(false)} className={linkClass}>About Us</NavLink>
        </div>
      )}
    </nav>
  )
}

export default Navbar