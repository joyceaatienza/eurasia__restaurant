import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, Check, X, Clock, Upload, AlertTriangle } from 'lucide-react'
import heroImage from '../assets/bgHero.jpg'
import { reservationsApi } from '../services/reservationsApi'
import { useAuth } from '../context/AuthContext'
import { readCachedReservations, cacheReservations } from '../hooks/CustomerNotif'
import { setAdvanceOrder } from '../utils/advanceOrder'

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]
const ITEM_H = 40

const OPEN_HOUR = 11   // 11:00 AM
const CLOSE_HOUR = 22  // 10:00 PM

const CANCEL_CUTOFF_DAYS = 3

// How often My Reservation checks for updates from the front desk and cashier
const REFRESH_MS = 8000

const DOWNPAYMENT = {
  table: 1000,
  event: 5000,
}

const PAYMENT_ACCOUNTS = {
  GCash: {
    qrPlaceholder: true,
    accountName: "EURASIA RESTAURANT",
    accountNumber: "0917 012 4998",
  },
  Paymaya: {
    qrPlaceholder: true,
    accountName: "EURASIA RESTAURANT",
    accountNumber: "0917 012 4998",
  },
  "Bank Transfer": {
    qrPlaceholder: false,
    accountName: "Eurasia Restaurant Corp.",
    accountNumber: "BDO • 0012 3456 7890",
  },
};

// Reservations that are finished one way or another go to the History section
const CLOSED_STATUSES = ['cancelled', 'completed', 'no_show']

function to24Hour(hour12, ampm) {
  let h = parseInt(hour12, 10)
  if (ampm === 'PM' && h < 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h
}

function isTimeAllowed(h, m) {
  const mins = h * 60 + m
  return mins >= OPEN_HOUR * 60 && mins <= CLOSE_HOUR * 60
}

function getDefaultTime() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  if (!isTimeAllowed(h, m)) {
    return h < OPEN_HOUR ? `${String(OPEN_HOUR).padStart(2, '0')}:00` : `${String(CLOSE_HOUR).padStart(2, '0')}:00`
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// The API sends dates as UTC timestamps, so parse them into local date parts —
// slicing the raw string lands on the previous day here in UTC+8
function toLocalDate(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysUntil(value) {
  const target = toLocalDate(value)
  if (!target) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, muted: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false })
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextDay = cells.length - (firstDay + daysInMonth) + 1
    cells.push({ day: nextDay, muted: true })
    if (cells.length >= 42) break
  }
  return cells
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatDateDisplay(value) {
  const d = toLocalDate(value)
  if (!d) return ''
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return ''
  const [h, m] = String(timeStr).split(':').map(Number)
  if (isNaN(h)) return ''
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
}

// The database stores payment statuses in mixed casing ('Pending', 'verified'),
// so tidy them up for display: 'verified' → 'Verified'
function formatPaymentStatus(status) {
  if (!status) return 'Pending'
  const s = String(status)
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function StatusBadge({ status }) {
  const map = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-green-50 text-green-700',
    seated: 'bg-orange-50 text-orange-700',
    completed: 'bg-neutral-100 text-neutral-600',
    cancelled: 'bg-red-50 text-red-600',
    no_show: 'bg-red-50 text-red-600',
  }
  const tone = map[status] || 'bg-neutral-100 text-neutral-600'
  const label = status === 'no_show' ? 'No Show' : status

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-[Prata] capitalize ${tone}`}>
      {label || '—'}
    </span>
  )
}

function WheelColumn({ options, selected, onSelect, loop = true, isDisabled }) {
  const containerRef = useRef(null)
  const scrollTimer = useRef(null)
  const fromScroll = useRef(false)

  const looped = useMemo(
    () => (loop ? [...options, ...options, ...options] : options),
    [options, loop]
  )
  const baseOffset = loop ? options.length : 0

  const jumpTo = (el, top) => {
    const prev = el.style.scrollBehavior
    el.style.scrollBehavior = 'auto'
    el.scrollTop = top
    el.style.scrollBehavior = prev
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (fromScroll.current) {
      fromScroll.current = false
      return
    }
    const idx = options.indexOf(selected)
    if (idx === -1) return
    jumpTo(el, (baseOffset + idx) * ITEM_H)
  }, [selected, options, baseOffset])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    if (scrollTimer.current) clearTimeout(scrollTimer.current)

    scrollTimer.current = setTimeout(() => {
      const node = containerRef.current
      if (!node) return

      let index = Math.round(node.scrollTop / ITEM_H)

      if (loop) {
        const setLen = options.length
        if (index < setLen * 0.5) {
          jumpTo(node, node.scrollTop + setLen * ITEM_H)
          index += setLen
        } else if (index >= setLen * 2.5) {
          jumpTo(node, node.scrollTop - setLen * ITEM_H)
          index -= setLen
        }
      }

      const option = looped[index]
      if (option !== undefined && option !== selected) {
        fromScroll.current = true
        onSelect(option)
      }
    }, 100)
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[160px] overflow-y-auto relative text-center flex-1 cursor-grab active:cursor-grabbing select-none scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      <div style={{ height: '60px' }} className="shrink-0 pointer-events-none" />

      {looped.map((option, i) => {
        const disabled = isDisabled ? isDisabled(option) : false
        return (
          <div
            key={`${option}-${i}`}
            onClick={() => {
              fromScroll.current = true
              onSelect(option)
              if (containerRef.current) {
                jumpTo(containerRef.current, i * ITEM_H)
              }
            }}
            style={{ height: '40px', scrollSnapAlign: 'center' }}
            className="flex items-center justify-center transition-all font-[Prata]"
          >
            <span
              className={`transition-all ${
                selected === option
                  ? disabled
                    ? 'text-neutral-400 font-bold text-base opacity-60'
                    : 'text-[#1d080f] font-bold text-base opacity-100 scale-105'
                  : disabled
                  ? 'text-neutral-300 opacity-30 text-xs'
                  : 'text-neutral-400 opacity-40 hover:opacity-80 text-xs'
              }`}
            >
              {option}
            </span>
          </div>
        )
      })}

      <div style={{ height: '60px' }} className="shrink-0 pointer-events-none" />
    </div>
  )
}

function WheelTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [touched, setTouched] = useState(false)
  const containerRef = useRef(null)

  const parseCurrent = () => {
    if (!value) return { hour: '12', minute: '00', ampm: 'PM' }
    const [h, m] = value.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 === 0 ? 12 : h % 12
    return {
      hour: hour.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
      ampm,
    }
  }

  const current = parseCurrent()

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')), [])
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')), [])
  const period = useMemo(() => ['AM', 'PM'], [])

  const isHourDisabled = (hr) => {
    const h24 = to24Hour(hr, current.ampm)
    return !isTimeAllowed(h24, 0) && !isTimeAllowed(h24, 59)
  }

  const isMinuteDisabled = (min) => {
    const h24 = to24Hour(current.hour, current.ampm)
    return !isTimeAllowed(h24, parseInt(min, 10))
  }

  const isPeriodDisabled = (ap) => {
    const h24 = to24Hour(current.hour, ap)
    return !isTimeAllowed(h24, 0) && !isTimeAllowed(h24, 59)
  }

  const currentIsAllowed = isTimeAllowed(to24Hour(current.hour, current.ampm), parseInt(current.minute, 10))

  const updateTime = (newHour, newMin, newAmpm) => {
    const h = to24Hour(newHour, newAmpm)
    const time24 = `${h.toString().padStart(2, '0')}:${newMin}`
    onChange(time24)
    setTouched(true)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayString = `${current.hour}:${current.minute} ${current.ampm}`

  return (
    <div className="relative w-full" ref={containerRef}>
      <input type="hidden" name="time" value={value || ''} required />

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setTouched(true)
        }}
        className="w-full bg-white rounded-md px-4 py-3.5 flex items-center justify-between text-left font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
      >
        {/* The label above already says "Reservation Time", so only the time shows here */}
        <span className={touched ? (currentIsAllowed ? 'text-[#1d080f] font-medium' : 'text-neutral-400 font-medium') : 'text-neutral-400'}>
          {touched ? displayString : 'Select a time'}
        </span>
        <Clock size={16} className="text-neutral-400 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 bg-[#e6e1d8] rounded-xl shadow-xl border border-neutral-300/60 p-4">
          <div className="text-center font-[Prata] text-xs text-neutral-500 mb-2">
            Open daily: 11:00 AM – 10:00 PM
          </div>

          <div className="relative flex items-center justify-center bg-white/60 rounded-lg px-2 h-[160px] overflow-hidden">
            <div className="absolute top-[60px] left-4 right-4 h-[40px] border-t-2 border-b-2 border-[#1d080f]/25 pointer-events-none" />

            <WheelColumn
              options={hours}
              selected={current.hour}
              onSelect={(val) => updateTime(val, current.minute, current.ampm)}
              isDisabled={isHourDisabled}
            />

            <span className="font-[Prata] text-[#1d080f] font-bold text-lg px-1 pointer-events-none z-10">:</span>

            <WheelColumn
              options={minutes}
              selected={current.minute}
              onSelect={(val) => updateTime(current.hour, val, current.ampm)}
              isDisabled={isMinuteDisabled}
            />

            <WheelColumn
              options={period}
              selected={current.ampm}
              onSelect={(val) => updateTime(current.hour, current.minute, val)}
              loop={false}
              isDisabled={isPeriodDisabled}
            />
          </div>

          {!currentIsAllowed && (
            <p className="text-center text-[11px] text-neutral-500 font-[Prata] mt-3">
              This time is outside our operating hours.
            </p>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={!currentIsAllowed}
            className="w-full mt-3 bg-[#1d080f] text-white font-[Prata] text-xs py-2.5 rounded-md hover:opacity-90 transition font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

/* Small banner for validation messages and errors */
function Toast({ message, tone = 'error', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const palette =
    tone === 'error'
      ? 'bg-[#c0392b] text-white'
      : 'bg-[#2e5a2e] text-white'

  return (
    <div
      className={`fixed bottom-7 right-7 z-[140] rounded-xl px-5 py-4 shadow-2xl flex items-start gap-3 max-w-sm ${palette}`}
    >
      <span className="w-8 h-8 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
        {tone === 'error' ? <X size={18} /> : <Check size={18} />}
      </span>
      <span className="text-sm font-[Prata] leading-snug">{message}</span>
    </div>
  )
}

/* Confirmation dialog — replaces window.confirm */
function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <X size={26} className="text-red-500" />
        </div>
        <h3 className="font-[Prata] text-lg text-[#1d080f] mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-neutral-300 text-neutral-700 font-[Prata] text-xs py-2.5 rounded-xl hover:bg-neutral-50 transition"
          >
            Keep Reservation
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#c0392b] text-white font-[Prata] text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* A photo the customer can tap to see full size and make sure it's the right one */
function ZoomableImage({ src, alt, className, onRemove }) {
  const [zoomed, setZoomed] = useState(false)

  // While the full-size view is open: lock the page behind it and let Esc close it
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e) => {
      if (e.key === 'Escape') setZoomed(false)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [zoomed])

  if (!src) return null

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          title="Tap to view full size"
          className="relative block w-full cursor-zoom-in"
        >
          <img src={src} alt={alt} className={className} />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-[Prata] px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
            Tap to view full size
          </span>
        </button>

        {/* Only the upload previews get a remove button — saved reservations don't */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove this photo"
            aria-label="Remove this photo"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[160] bg-black/85 flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition"
          >
            <X size={22} />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl cursor-default"
          />
          <p className="mt-3 text-sm text-white/80 font-[Prata] text-center">
            Tap anywhere outside the photo to close
          </p>
        </div>
      )}
    </>
  )
}

/* A saved photo (proof of payment or theme) that's only downloaded when the guest taps it,
   so the reservation list itself stays light and quick to refresh */
function SavedPhoto({ reservationId, field, label, imgClass }) {
  const [src, setSrc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const full = await reservationsApi.getById(reservationId)
      if (full?.[field]) setSrc(full[field])
      else setError('No photo found.')
    } catch {
      setError('Could not load the photo. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (src) return <ZoomableImage src={src} alt={label} className={imgClass} />

  return (
    <>
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="w-full border border-dashed border-neutral-300 rounded-md py-3 text-xs font-[Prata] text-neutral-600 hover:bg-neutral-50 transition disabled:opacity-60"
      >
        {loading ? 'Loading…' : `View ${label.toLowerCase()}`}
      </button>
      {error && <p className="text-xs text-red-500 font-[Prata] mt-1">{error}</p>}
    </>
  )
}

/* Shown once the front desk confirms: the guest pays the downpayment here */
function DownpaymentPanel({ reservation, onPaid, onError }) {
  const amount = Number(reservation.downpayment_amount || 0)
  const [method, setMethod] = useState('')
  const [proof, setProof] = useState('')
  const [proofName, setProofName] = useState('')
  const [sending, setSending] = useState(false)

  const isCash = method === 'Cash'
  const account = PAYMENT_ACCOUNTS[method]

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProofName(file.name)
    const reader = new FileReader()
    reader.onload = () => setProof(reader.result)
    reader.readAsDataURL(file)
  }

  const submit = async () => {
    if (!method) return onError("Please choose how you'll pay the downpayment.")
    if (!isCash && !proof) return onError('Please upload your proof of payment.')
    try {
      setSending(true)
      await reservationsApi.payDownpayment(reservation.id, {
        payment_method: method,
        payment_proof: isCash ? null : proof,
      })
      onPaid(reservation.id, method, !isCash)
    } catch (err) {
      onError(err.message || 'Failed to submit your downpayment. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-left font-[Prata]">
      <p className="text-sm font-bold text-emerald-900 mb-1">Your reservation is confirmed!</p>
      <p className="text-xs text-emerald-900 leading-relaxed mb-3">
        Pay your Php. {amount.toLocaleString()} downpayment to secure your reservation.
      </p>

      <div className="relative mb-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={`w-full bg-white rounded-md px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#1d080f] ${method ? 'text-[#1d080f]' : 'text-neutral-400'}`}
        >
          <option value="" disabled>Choose how you'll pay</option>
          <option className="text-[#1d080f]">GCash</option>
          <option className="text-[#1d080f]">Paymaya</option>
          <option className="text-[#1d080f]">Bank Transfer</option>
          <option className="text-[#1d080f]">Cash</option>
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
      </div>

      {isCash && (
        <p className="text-xs text-neutral-700 leading-relaxed mb-3 bg-white rounded-lg p-3">
          Pay the downpayment in cash at the restaurant. Our cashier will mark it as received.
        </p>
      )}

      {account && (
        <div className="bg-white rounded-lg p-3 mb-3 flex items-center gap-3">
          {account.qrPlaceholder && (
            <div className="w-16 h-16 shrink-0 rounded-md border border-dashed border-neutral-300 flex items-center justify-center text-[9px] text-neutral-400">
              QR Code
            </div>
          )}
          <div className="text-xs min-w-0">
            <div className="text-neutral-500">Account Name</div>
            <div className="text-[#1d080f] font-bold mb-1">{account.accountName}</div>
            <div className="text-neutral-500">{method === 'Bank Transfer' ? 'Account Number' : 'Number'}</div>
            <div className="text-[#1d080f] font-bold">{account.accountNumber}</div>
          </div>
        </div>
      )}

      {method && !isCash && (
        <div className="mb-3">
          <label className="flex items-center justify-center gap-2 bg-white border-2 border-dashed border-neutral-300 rounded-md py-4 px-3 cursor-pointer hover:bg-neutral-50 transition">
            {proof ? (
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <Check size={15} /> Photo attached — check it below
              </span>
            ) : (
              <>
                <Upload size={15} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">Upload proof of payment</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {proof && (
            <div className="mt-2">
              <ZoomableImage
                src={proof}
                alt="Proof of payment preview"
                onRemove={() => { setProof(''); setProofName('') }}
                className="w-full max-h-40 object-contain rounded-md bg-white"
              />
              <p className="mt-1.5 text-[11px] text-neutral-600 text-center break-all">{proofName}</p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={sending || !method}
        className="w-full bg-[#1d080f] text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 rounded-full hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {sending ? 'Submitting...' : isCash ? "I'll Pay in Cash at the Restaurant" : 'Submit Downpayment'}
      </button>
    </div>
  )
}

/* A small label above each field, so guests know what goes where even after typing */
function Field({ label, children }) {
  return (
    <div className="text-left min-w-0">
      <label className="block text-xs font-[Prata] text-neutral-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Reservation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [tab, setTab] = useState("table")

  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())

  const [selectedTime, setSelectedTime] = useState(getDefaultTime)
  const [showConfirm, setShowConfirm] = useState(false)
  const [occasion, setOccasion] = useState("")
  // Table reservations: regular seating or the VIP area
  const [vipArea, setVipArea] = useState(false)
  const [themeImagePreview, setThemeImagePreview] = useState("")
  // File name, shown under the preview so the customer knows which photo they picked
  const [themeImageName, setThemeImageName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [reservations, setReservations] = useState(() => readCachedReservations() || [])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [toast, setToast] = useState({ message: '', tone: 'error' })
  const [cancelTarget, setCancelTarget] = useState(null)
  // The reservation whose new downpayment proof is being sent
  const [reuploadingId, setReuploadingId] = useState(null)

  // --- Jumping to a reservation from a notification ---
  const [highlightId, setHighlightId] = useState(null)
  const highlightRef = useRef(null)
  const [reservationsLoaded, setReservationsLoaded] = useState(() => readCachedReservations() !== null)
  const [pendingReservationId, setPendingReservationId] = useState(null)

  const showError = (message) => setToast({ message, tone: 'error' })
  const closeToast = () => setToast({ message: '', tone: 'error' })

  const isoDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

    // Times closed off on the chosen date (an event, or the front desk marked it full)
  const [blockedSlots, setBlockedSlots] = useState([])

  useEffect(() => {
    if (tab === 'history') return
    let cancelled = false
    reservationsApi.getBlockedSlots(isoDate).then((slots) => {
      if (!cancelled) setBlockedSlots(slots)
    })
    return () => { cancelled = true }
  }, [isoDate, tab])

  // "HH:MM" strings compare correctly as text
  const slotStart = (b) => String(b.start_time || '').slice(0, 5)
  const slotEnd = (b) => String(b.end_time || '').slice(0, 5)
  const isTimeBlocked = (time) =>
    blockedSlots.find((b) => time >= slotStart(b) && time < slotEnd(b)) || null

  const chosenBlock = selectedTime ? isTimeBlocked(String(selectedTime).slice(0, 5)) : null

  // The logged-in customer's own reservations
  const loadReservations = useCallback(() => {
    return reservationsApi.getMine()
      .then((data) => {
        setReservations(data)
        cacheReservations(data)
      })
      .catch((err) => console.error('Failed to load reservations:', err))
      .finally(() => setReservationsLoaded(true))
  }, [])

  // Load once, then keep checking so a confirmation, verification or failed
  // downpayment shows up without refreshing the page
  useEffect(() => {
    if (!isAuthenticated) {
      setReservations([])
      return
    }
    // Only show "Loading..." when there's no saved copy to show in the meantime
    if (readCachedReservations() === null) setLoadingReservations(true)
    loadReservations().finally(() => setLoadingReservations(false))

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadReservations()
    }, REFRESH_MS)
    // Coming back to the tab checks right away
    const onFocus = () => loadReservations()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [isAuthenticated, loadReservations])

  // A notification tap lands here with the reservation it's about
  useEffect(() => {
    const target = location.state?.highlight
    if (!target || target.type !== 'reservation') return
    setTab('history')
    setPendingReservationId(target.id)
    // Clear it so a refresh doesn't jump again
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // As soon as the reservations are on hand, jump to the one that was tapped —
  // reuses the list the page already loads instead of fetching it a second time
  useEffect(() => {
    if (pendingReservationId == null || !reservationsLoaded) return
    const found = reservations.find((r) => String(r.id) === String(pendingReservationId))
    setPendingReservationId(null)
    if (found) {
      setHighlightId(found.id)
    } else {
      showError('That reservation could no longer be found.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReservationId, reservationsLoaded, reservations])

  // Scroll to the highlighted reservation right away, then fade the highlight after 4 seconds
  useEffect(() => {
    if (!highlightId) return
    const frame = requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    const clear = setTimeout(() => setHighlightId(null), 4000)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(clear)
    }
  }, [highlightId])

  // Split into what's still coming up and what's already done
  const { upcomingReservations, pastReservations } = useMemo(() => {
    const upcoming = []
    const past = []
    reservations.forEach((r) => {
      const remaining = daysUntil(r.reservation_date)
      const isClosed = CLOSED_STATUSES.includes(r.status)
      const isPastDate = remaining !== null && remaining < 0
      if (isClosed || isPastDate) past.push(r)
      else upcoming.push(r)
    })
    // Soonest first for upcoming, most recent first for history
    upcoming.sort((a, b) => toLocalDate(a.reservation_date) - toLocalDate(b.reservation_date))
    past.sort((a, b) => toLocalDate(b.reservation_date) - toLocalDate(a.reservation_date))
    return { upcomingReservations: upcoming, pastReservations: past }
  }, [reservations])

  const cells = useMemo(
    () => buildCalendar(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  )

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1))
  }

  const handleThemeImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThemeImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => setThemeImagePreview(reader.result)
    reader.readAsDataURL(file)
    // Lets the same photo be picked again after removing it
    e.target.value = ''
  }

  const clearThemeImage = () => {
    setThemeImagePreview("")
    setThemeImageName("")
  }

  // Clears the form back to how it started
  const resetForm = (form) => {
    form?.reset()
    setSelectedTime(getDefaultTime())
    setOccasion("")
    setVipArea(false)
    clearThemeImage()
  }

  const handleConfirm = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const time = formData.get('time')

    if (!time) {
      showError("Please select a time.")
      return
    }

    const [hh, mm] = time.split(':').map(Number)
    if (!isTimeAllowed(hh, mm)) {
      showError("Please choose a time between 11:00 AM and 10:00 PM.")
      return
    }

        const blocked = isTimeBlocked(time.slice(0, 5))
    if (blocked) {
      showError(`That time isn't available. Please choose a time outside ${formatTimeDisplay(slotStart(blocked))} – ${formatTimeDisplay(slotEnd(blocked))}.`)
      return
    }

    const downpaymentAmount = tab === "event" ? DOWNPAYMENT.event : DOWNPAYMENT.table

    const payload = {
      reservation_type: tab,
      guest_name: user.full_name,
      contact_number: user.contact_number,
      email: user.email,
      party_size: formData.get('persons'),
      // Events have an occasion; tables pick regular or VIP seating instead
      occasion: tab === 'event' ? (occasion || null) : null,
      vip_area: tab === 'table' && vipArea ? 1 : 0,
      reservation_date: isoDate,
      reservation_time: `${time}:00`,
      // Both kinds have a note (e.g. why the VIP area, or event details)
      special_requests: formData.get('note') || null,
      theme_image: tab === 'event' ? (themeImagePreview || null) : null,
      downpayment_amount: downpaymentAmount,
      // Paid later, once the front desk confirms — avoids paying for a slot that's taken
      payment_method: null,
      payment_proof: null,
    }

    try {
      setSubmitting(true)
      const created = await reservationsApi.create(payload)
      setReservations((prev) => [created, ...prev])
      resetForm(e.target)
      setShowConfirm(true)
    } catch (err) {
      console.error(err)
      showError(err.message || "Sorry, something went wrong while submitting your reservation. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelReservation = async () => {
    const id = cancelTarget
    setCancelTarget(null)
    if (!id) return

    try {
      await reservationsApi.updateStatus(id, 'cancelled')
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))
      setToast({ message: 'Your reservation has been cancelled.', tone: 'success' })
    } catch (err) {
      console.error(err)
      showError("Failed to cancel reservation. Please try again.")
    }
  }

    // Order food ahead for this reservation: pick dishes on the Menu page as usual
  const startAdvanceOrder = (r) => {
    const d = toLocalDate(r.reservation_date)
    const date = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : ''
    setAdvanceOrder({ reservationId: r.id, date, time: String(r.reservation_time || '').slice(0, 5) })
    navigate('/menu')
  }

  // The guest paid the downpayment after the front desk confirmed
  const handleDownpaymentPaid = (id, method, hasProof) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, payment_method: method, payment_status: 'pending', has_payment_proof: hasProof ? 1 : r.has_payment_proof }
          : r
      )
    )
    setToast({
      message: method === 'Cash'
        ? 'Got it! Please pay your downpayment in cash at the restaurant.'
        : 'Downpayment submitted. The cashier will verify it shortly.',
      tone: 'success',
    })
  }

  // After a failed downpayment: read the new photo and send it straight to the cashier
  const handleReuploadProof = (reservation, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setReuploadingId(reservation.id)
        await reservationsApi.reuploadProof(reservation.id, reader.result)
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservation.id
              ? { ...r, payment_status: 'pending', has_payment_proof: 1 }
              : r
          )
        )
        setToast({ message: 'New proof of payment sent. The cashier will verify it shortly.', tone: 'success' })
      } catch (err) {
        console.error(err)
        showError(err.message || 'Failed to upload proof of payment. Please try again.')
      } finally {
        setReuploadingId(null)
      }
    }
    reader.readAsDataURL(file)
  }

  // One reservation card — used by both the Upcoming and History sections
  const renderReservationCard = (r) => {
    const remainingDays = daysUntil(r.reservation_date)
    const isClosed = CLOSED_STATUSES.includes(r.status)
    const isPastDate = remainingDays !== null && remainingDays < 0
    const pastCutoff = remainingDays !== null && remainingDays < CANCEL_CUTOFF_DAYS
    const cancelDisabled = isClosed || pastCutoff
    const isHighlighted = r.id === highlightId

    const status = String(r.status || '').toLowerCase()
    const payStatus = String(r.payment_status || 'pending').toLowerCase()
    const hasDownpayment = Number(r.downpayment_amount) > 0
    const isCashDownpayment = String(r.payment_method || '').toLowerCase() === 'cash'
    // The cashier rejected the downpayment proof; an upcoming reservation can send a new one
    const downpaymentFailed = hasDownpayment && payStatus === 'failed'
    const canReupload = downpaymentFailed && !isClosed && !isPastDate
    // Confirmed by the front desk but nothing paid yet: show the payment box
    const needsDownpayment =
      status === 'confirmed' && hasDownpayment && payStatus === 'pending' && !r.payment_method && !isPastDate
    // Paid, now waiting for the cashier
    const awaitingVerification =
      hasDownpayment && payStatus === 'pending' && Boolean(r.payment_method) && !isClosed && !isPastDate

    return (
      <div
        key={r.id}
        ref={isHighlighted ? highlightRef : null}
        className={`rounded-xl p-6 mb-4 transition-shadow duration-500 ${
          r.status === 'cancelled' || r.status === 'no_show'
            ? 'bg-neutral-100 opacity-60'
            : 'bg-white'
        } ${isHighlighted ? 'ring-4 ring-[#f2c14e]/70 !opacity-100' : ''}`}
        style={{ textAlign: 'left' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-[Prata] text-left">
          <div className="flex flex-col gap-3">
            <div>
              <span className="block text-xs text-neutral-400">Date</span>
              <span>{formatDateDisplay(r.reservation_date)}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400">Name</span>
              <span>{r.guest_name}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400">Contact No.</span>
              <span>{r.contact_number}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400">Email Address</span>
              <span className="break-all">{r.email}</span>
            </div>
            {r.reservation_type === 'event' ? (
              <div>
                <span className="block text-xs text-neutral-400">Occasion</span>
                <span>{r.occasion || '—'}</span>
              </div>
            ) : (
              <div>
                <span className="block text-xs text-neutral-400">Seating Area</span>
                <span>{Number(r.vip_area) ? 'VIP Area' : 'Regular'}</span>
              </div>
            )}
            {r.special_requests && (
              <div>
                <span className="block text-xs text-neutral-400">Note</span>
                <span className="break-words">{r.special_requests}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <span className="block text-xs text-neutral-400">Time</span>
              <span>{formatTimeDisplay(r.reservation_time)}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400">Number of Pax</span>
              <span>{r.party_size}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400">Downpayment</span>
              <span className={downpaymentFailed ? 'text-red-700 font-semibold' : ''}>
                {hasDownpayment
                  ? `Php. ${Number(r.downpayment_amount).toLocaleString()} (${r.payment_method ? formatPaymentStatus(r.payment_status) : 'Not paid yet'})`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400">Payment Method</span>
              <span>{r.payment_method || '—'}</span>
            </div>
            <div>
              <span className="block text-xs text-neutral-400 mb-1">Status</span>
              <StatusBadge status={r.status} />
            </div>

            {/* Order food ahead once the front desk confirms, so nothing's cooked for a slot that falls through */}
            {status === 'confirmed' && !isPastDate && (
              <button
                type="button"
                onClick={() => startAdvanceOrder(r)}
                className="w-full border border-[#1d080f] text-[#1d080f] font-[Prata] font-bold text-sm py-2.5 rounded-full hover:bg-[#1d080f] hover:text-white transition"
              >
                Advance Order
              </button>
            )}
            {status === 'pending' && !isPastDate && (
              <p className="text-[11px] text-neutral-500 font-[Prata] text-center leading-relaxed">
                You can order your food ahead once your reservation is confirmed.
              </p>
            )}

            {/* Only upcoming reservations can still be cancelled */}
            {!isClosed && !isPastDate && (
              <div>
                <button
                  onClick={() => setCancelTarget(r.id)}
                  disabled={cancelDisabled}
                  className="w-full bg-[#c0392b] text-white font-[Prata] font-bold py-3 rounded-full hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel Reservation
                </button>
                <p className="text-[11px] text-neutral-500 font-[Prata] mt-2 text-center leading-relaxed">
                  {pastCutoff
                    ? `This can no longer be cancelled. Cancellations must be made at least ${CANCEL_CUTOFF_DAYS} days before your reservation date.`
                    : `You can cancel until ${CANCEL_CUTOFF_DAYS} days before your reservation date (${remainingDays} days left).`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Still with the front desk — and any note they left, e.g. "please wait 5 mins" */}
        {status === 'pending' && !isPastDate && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-left font-[Prata]">
            <p className="text-sm font-bold text-amber-900 mb-1">Waiting for confirmation</p>
            <p className="text-xs text-amber-900 leading-relaxed">
              The front desk is checking availability. You'll be asked to pay the downpayment once it's confirmed.
            </p>
            {r.remarks && (
              <p className="text-xs text-amber-900 leading-relaxed mt-2 bg-white/70 rounded-lg p-2.5">
                <span className="font-bold">Note from the front desk:</span> {r.remarks}
              </p>
            )}
          </div>
        )}

        {needsDownpayment && (
          <DownpaymentPanel reservation={r} onPaid={handleDownpaymentPaid} onError={showError} />
        )}

        {awaitingVerification && (
          <div className="mt-5 bg-neutral-50 border border-neutral-200 rounded-xl p-3 sm:p-4 text-left font-[Prata]">
            <p className="text-xs text-neutral-700 leading-relaxed">
              {isCashDownpayment
                ? 'Please pay your downpayment in cash at the restaurant. The cashier will mark it as received.'
                : 'Downpayment submitted. Waiting for the cashier to verify your payment.'}
            </p>
          </div>
        )}

        {/* Same as a failed order payment: explain it, and let them send a new proof */}
        {canReupload && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-left">
            <p className="text-sm font-[Prata] font-bold text-red-800 mb-1">Downpayment failed</p>
            {isCashDownpayment ? (
              <p className="text-xs font-[Prata] text-red-800 leading-relaxed">
                The cashier couldn't confirm your cash downpayment. Please settle it at the restaurant or contact us.
              </p>
            ) : (
              <>
                <p className="text-xs font-[Prata] text-red-800 leading-relaxed mb-3">
                  {r.failure_reason
                    ? <><b>Reason:</b> {r.failure_reason}. Please upload a new proof of payment.</>
                    : "Your payment couldn't be verified, possibly due to an unclear photo or incorrect amount, so please upload a new one."}                </p>
                <label
                  className={`flex items-center justify-center gap-2 w-full bg-[#c0392b] text-white font-[Prata] text-xs sm:text-sm font-bold px-4 py-2.5 sm:py-3 rounded-full whitespace-nowrap text-center leading-tight transition ${
                    reuploadingId === r.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'
                  }`}
                >
                  <Upload size={15} className="shrink-0" />
                  {reuploadingId === r.id ? 'Uploading...' : 'Re-upload Proof of Payment'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={reuploadingId === r.id}
                    onChange={(e) => handleReuploadProof(r, e)}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {Boolean(r.has_payment_proof ?? r.payment_proof) && (
          <div className="mt-4">
            <span className="block text-xs text-neutral-400 font-[Prata] mb-2">Proof of Payment</span>
            {/* The key resets it after a re-upload, so the new photo is the one shown */}
            <SavedPhoto
              key={`${r.id}-proof-${r.payment_status}`}
              reservationId={r.id}
              field="payment_proof"
              label="Proof of Payment"
              imgClass="w-full max-h-48 object-contain rounded-md bg-neutral-50"
            />
          </div>
        )}

        {Boolean(r.has_theme_image ?? r.theme_image) && (
          <div className="mt-4">
            <span className="block text-xs text-neutral-400 font-[Prata] mb-2">Theme Inspiration</span>
            <SavedPhoto
              key={`${r.id}-theme`}
              reservationId={r.id}
              field="theme_image"
              label="Theme Photo"
              imgClass="w-full max-h-48 object-cover rounded-md"
            />
          </div>
        )}
      </div>
    )
  }

  const inputClass =
    "w-full bg-white rounded-md px-4 py-3.5 text-[#1d080f] placeholder:text-neutral-400 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"

  const lockedInputClass =
    "w-full bg-neutral-100 rounded-md px-4 py-3.5 text-[#1d080f] font-[Prata] cursor-not-allowed"

  return (
    <div className="bg-white text-[#1d080f]">
      <div className="relative h-44 sm:h-52 md:h-60 overflow-hidden shrink-0">
        <img src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-center justify-center px-4 pb-8 md:pb-16">
          <h1
            className="font-[Prata] font-bold text-xs md:text-xs text-[#1d080f]"
            style={{
              WebkitTextStroke: '0.7px #1d080f',
              letterSpacing: '1.5px',
              // Small enough to fit the shorter phone hero, full size on desktop
              fontSize: 'clamp(34px, 9.5vw, 50px)',
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Have a Reservation Now!
          </h1>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}> </div>
      <div className="max-w-5xl mx-auto px-4 md:px-3 -mt-24 md:-mt-32 relative z-10 pb-16">
        <div className="bg-[#e6e1d8] rounded-xl shadow-xl p-4 sm:p-6 md:p-10">

          {authLoading ? (
            <p className="text-center py-16 text-sm text-neutral-500 font-[Prata]">Loading...</p>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="font-[Prata] text-lg text-[#1d080f] mb-2">Log in to make a reservation</p>
              <p className="text-sm text-neutral-500 font-[Prata] mb-8">
                You need an account to book a table or an event with us.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#1d080f] text-white font-[Prata] font-bold px-10 py-3 rounded-full hover:opacity-90 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="border border-[#1d080f] text-[#1d080f] font-[Prata] font-bold px-10 py-3 rounded-full hover:bg-[#1d080f] hover:text-white transition"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Three equal columns that always fit; smaller text on a phone */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                {[
                  { key: "table", label: "Table Reservation" },
                  { key: "event", label: "Event Reservation" },
                  { key: "history", label: "My Reservation" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`min-w-0 px-1.5 sm:px-3 py-2.5 sm:py-4 rounded-xl text-xs sm:text-base md:text-lg leading-tight font-[Prata] font-bold transition-colors ${
                      tab === t.key
                        ? 'bg-[#1d080f] text-white'
                        : 'bg-neutral-200/70 text-[#1d080f] hover:bg-neutral-300/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab !== "history" && (
                <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-6">
                  <div>
                    <div className="font-[Prata] text-lg mb-4">Select a date</div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex items-center justify-between mb-3 font-[Prata] font-bold text-base">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-neutral-100 rounded">
                          <ChevronLeft size={16} />
                        </button>
                        <span>{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-neutral-100 rounded">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-y-1 text-center text-sm font-[Prata]">
                        {WEEKDAYS.map((w, i) => (
                          <div key={i} className="font-bold text-[#1d080f] py-1">{w}</div>
                        ))}
                        {cells.map((c, i) => {
                          const cellDate = c.muted ? null : new Date(viewDate.getFullYear(), viewDate.getMonth(), c.day)
                          const isPast = cellDate && cellDate < today
                          const disabled = c.muted || isPast
                          return (
                            <div
                              key={i}
                              onClick={() => !disabled && setSelectedDay(c.day)}
                              className={`py-1.5 rounded ${
                                disabled
                                  ? 'text-neutral-300 cursor-not-allowed'
                                  : c.day === selectedDay
                                  ? 'bg-[#1d080f] text-white cursor-pointer'
                                  : 'text-[#1d080f] hover:bg-neutral-100 cursor-pointer'
                              }`}
                            >
                              {c.day}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <form id="reservation-form" onSubmit={handleConfirm} className="flex flex-col gap-4 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full Name">
                        <input value={user?.full_name || ''} readOnly className={lockedInputClass} />
                      </Field>
                      <Field label="Contact Number">
                        <input value={user?.contact_number || ''} readOnly className={lockedInputClass} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Email Address">
                        <input value={user?.email || ''} readOnly className={lockedInputClass} />
                      </Field>
                      <Field label="Reservation Time *">
                        <WheelTimePicker value={selectedTime} onChange={setSelectedTime} />
                      </Field>
                    </div>

                    {/* Closed-off times on this date: amber as a heads-up, red if the chosen time falls inside */}
                    {blockedSlots.length > 0 && (
                      <div
                        className={`rounded-xl border p-3 sm:p-4 text-left font-[Prata] ${
                          chosenBlock ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        {chosenBlock ? (
                          <p className="text-sm font-bold mb-1">
                            {formatTimeDisplay(selectedTime)} isn't available.
                          </p>
                        ) : (
                          <p className="text-sm font-bold mb-1">Unavailable on this date</p>
                        )}
                        <ul className="text-xs leading-relaxed space-y-0.5">
                          {blockedSlots.map((b, i) => (
                            <li key={i}>
                              {formatTimeDisplay(slotStart(b))} – {formatTimeDisplay(slotEnd(b))}
                              {b.reason ? ` (${b.reason})` : ''}
                            </li>
                          ))}
                        </ul>
                        {chosenBlock && (
                          <p className="text-xs mt-1.5">Please choose a time outside these hours, or another date.</p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tab === "table" ? (
                        /* Tables: regular seating or the VIP area */
                        <Field label="Seating Area *">
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: false, label: "Regular" },
                              { value: true, label: "VIP Area" },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setVipArea(opt.value)}
                                className={`py-3.5 rounded-md text-sm font-[Prata] transition ${
                                  vipArea === opt.value
                                    ? 'bg-[#1d080f] text-white'
                                    : 'bg-white text-[#1d080f] hover:bg-neutral-100'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </Field>
                      ) : (
                        /* Events: what the celebration is */
                        <div className="relative text-left">
                          <label className="block text-xs font-[Prata] text-neutral-600 mb-1.5">Occasion *</label>
                          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} required className={`${inputClass} appearance-none ${occasion ? 'text-[#1d080f]' : 'text-neutral-400'}`}>
                            <option value="" disabled className="text-neutral-400">Choose an occasion</option>
                            <option className="text-[#1d080f]">Birthday</option>
                            <option className="text-[#1d080f]">Anniversary</option>
                            <option className="text-[#1d080f]">Wedding</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-4 bottom-4 pointer-events-none text-neutral-400" />
                        </div>
                      )}
                      <Field label="Number of Pax *">
                        <input name="persons" type="number" min="1" placeholder="e.g. 4" required className={inputClass} />
                      </Field>
                    </div>

                    {tab === "event" && (
                      <>
                        <Field label="Theme Preference *">
                          <input name="preference" placeholder="e.g. rustic, all-white, garden" required className={inputClass} />
                        </Field>

                        <div className="bg-white rounded-md p-4 text-left">
                          <label className="font-[Prata] text-sm text-neutral-600 block mb-2">
                            Theme Inspiration Photo (optional)
                          </label>
                          <label
                            htmlFor="theme-image-upload"
                            className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-md py-6 px-3 cursor-pointer hover:bg-neutral-50 transition"
                          >
                            {themeImagePreview ? (
                              <span className="font-[Prata] text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                                <Check size={16} /> Photo attached — check it below
                              </span>
                            ) : (
                              <>
                                <Upload size={16} className="text-neutral-400" />
                                <span className="font-[Prata] text-xs text-neutral-500">Click to upload a photo</span>
                              </>
                            )}
                          </label>
                          <input
                            id="theme-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleThemeImageChange}
                            className="hidden"
                          />
                          {themeImagePreview && (
                            <div className="mt-3">
                              <ZoomableImage
                                src={themeImagePreview}
                                alt="Theme preview"
                                onRemove={clearThemeImage}
                                className="w-full max-h-40 object-cover rounded-md"
                              />
                              <p className="mt-2 text-xs text-neutral-600 font-[Prata] text-center break-all">
                                {themeImageName} — tap the upload box above to choose a different one.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Tables only ask for a note when the VIP area is picked; events always can */}
                    {(tab === "event" || vipArea) && (
                      <Field label={tab === "table" ? "What's the VIP area for? (optional)" : "Note (optional)"}>
                        <textarea
                          name="note"
                          placeholder={
                            tab === "table"
                              ? "e.g. business meeting, bridal shower, graduation celebration"
                              : "Anything else we should know about your event"
                          }
                          className={`${inputClass} resize-none h-20`}
                        />
                      </Field>
                    )}

                    {/* No payment yet — it's asked for once the front desk confirms the slot */}
                    <div className="bg-white rounded-xl p-5 text-left">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-[Prata] text-sm text-neutral-600">Required Downpayment</span>
                        <span className="font-[Prata] font-bold text-lg text-[#1d080f] whitespace-nowrap">
                          Php. {(tab === "event" ? DOWNPAYMENT.event : DOWNPAYMENT.table).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-[Prata] leading-relaxed">
                        No payment needed yet. Once the front desk confirms your reservation, you'll pay the
                        downpayment in My Reservation. It will be deducted from your final bill.
                      </p>
                    </div>

                    <div className="flex gap-3 sm:gap-4 mt-8 w-full max-w-md">
                      <button
                        type="button"
                        onClick={() => resetForm(document.getElementById('reservation-form'))}
                        className="flex-1 px-3 bg-[#c0392b] text-white font-[Prata] font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-full hover:opacity-90 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="reservation-form"
                        disabled={submitting || Boolean(chosenBlock)}
                        className="flex-[1.6] px-4 whitespace-nowrap bg-[#1d080f] text-white font-[Prata] font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Reservation"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ---------------- MY RESERVATION ---------------- */}
              {tab === "history" && (
                <div>
                  {/* The 3-day cancellation policy, up front where people see it */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-5 py-4 mb-6 text-left">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div className="text-sm font-[Prata] leading-relaxed">
                      <p className="font-bold">Cancellation policy</p>
                      <p>
                        Reservations can only be cancelled at least {CANCEL_CUTOFF_DAYS} days before the reservation date.
                        Downpayments are non-refundable.
                      </p>
                    </div>
                  </div>

                  {loadingReservations ? (
                    <p className="text-neutral-500 text-center py-8 text-sm font-[Prata]">Loading...</p>
                  ) : (
                    <>
                      <h3 className="font-[Prata] text-lg text-[#1d080f] mb-4 text-left">
                        Upcoming ({upcomingReservations.length})
                      </h3>
                      {upcomingReservations.length === 0 ? (
                        <p className="bg-white/60 rounded-xl text-neutral-500 text-center py-8 mb-8 text-sm font-[Prata]">
                          No upcoming reservations.
                        </p>
                      ) : (
                        <div className="mb-8">{upcomingReservations.map(renderReservationCard)}</div>
                      )}

                      <h3 className="font-[Prata] text-lg text-[#1d080f] mb-4 text-left">
                        History ({pastReservations.length})
                      </h3>
                      {pastReservations.length === 0 ? (
                        <p className="bg-white/60 rounded-xl text-neutral-500 text-center py-8 text-sm font-[Prata]">
                          No past reservations yet.
                        </p>
                      ) : (
                        pastReservations.map(renderReservationCard)
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this reservation?"
        message={`Your downpayment is non-refundable, and reservations can only be cancelled at least ${CANCEL_CUTOFF_DAYS} days before the date. This cannot be undone.`}
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancelReservation}
        onCancel={() => setCancelTarget(null)}
      />

      <Toast message={toast.message} tone={toast.tone} onClose={closeToast} />

      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-lg p-8 max-w-sm w-full text-center"
          >
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <X size={16} />
            </button>
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="font-[Prata] text-lg mb-3">Reservation Submitted!</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Our front desk will check availability and confirm your reservation. Once confirmed, you can pay
              your downpayment in My Reservation. <br /><br />
              <b>REMINDER:</b> Cancellations must be made at least 3 days before your reservation date.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservation
