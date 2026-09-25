import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, Check, X, Clock, Upload } from 'lucide-react'
import heroImage from '../assets/bgHero.jpg'
import { reservationsApi } from '../services/reservationsApi'
import { useAuth } from '../context/AuthContext'

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]
const ITEM_H = 40

const OPEN_HOUR = 11   // 11:00 AM
const CLOSE_HOUR = 22  // 10:00 PM

const CANCEL_CUTOFF_DAYS = 3

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

function daysUntil(isoDate) {
  if (!isoDate) return null
  const [y, m, d] = String(isoDate).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d)
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

function formatDateDisplay(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = String(isoDate).slice(0, 10).split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`
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
        <span className="flex items-baseline gap-2">
          <span className="text-neutral-400">Time *</span>
          {touched && <span className={currentIsAllowed ? 'text-[#1d080f] font-medium' : 'text-neutral-400 font-medium'}>{displayString}</span>}
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

function Reservation() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [tab, setTab] = useState("table")

  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())

  const [selectedTime, setSelectedTime] = useState(getDefaultTime)
  const [showConfirm, setShowConfirm] = useState(false)
  const [occasion, setOccasion] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentProofPreview, setPaymentProofPreview] = useState("")
  const [themeImagePreview, setThemeImagePreview] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [reservations, setReservations] = useState([])
  const [loadingReservations, setLoadingReservations] = useState(false)

  const isoDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  // Load the logged-in customer's own reservations
  useEffect(() => {
    if (!isAuthenticated) {
      setReservations([])
      return
    }
    setLoadingReservations(true)
    reservationsApi.getMine()
      .then((data) => setReservations(data))
      .catch((err) => console.error('Failed to load reservations:', err))
      .finally(() => setLoadingReservations(false))
  }, [isAuthenticated])

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
    const reader = new FileReader()
    reader.onload = () => setThemeImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handlePaymentProofChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPaymentProofPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleConfirm = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const time = formData.get('time')

    if (!time) {
      alert("Please select a time.")
      return
    }

    if (!paymentMethod) {
      alert("Please select a mode of payment.")
      return
    }

    if (!paymentProofPreview) {
      alert("Please upload your proof of payment.")
      return
    }

    const [hh, mm] = time.split(':').map(Number)
    if (!isTimeAllowed(hh, mm)) {
      alert("Please choose a time between 11:00 AM and 10:00 PM.")
      return
    }

    const downpaymentAmount = tab === "event" ? DOWNPAYMENT.event : DOWNPAYMENT.table

    const payload = {
      reservation_type: tab,
      guest_name: user.full_name,
      contact_number: user.contact_number,
      email: user.email,
      party_size: formData.get('persons'),
      occasion: occasion || null,
      reservation_date: isoDate,
      reservation_time: `${time}:00`,
      table_number: null,
      special_requests: tab === 'event' ? (formData.get('note') || null) : null,
      theme_image: tab === 'event' ? (themeImagePreview || null) : null,
      downpayment_amount: downpaymentAmount,
      payment_method: paymentMethod,
      payment_proof: paymentProofPreview,
    }

    try {
      setSubmitting(true)
      const created = await reservationsApi.create(payload)
      setReservations((prev) => [created, ...prev])

      e.target.reset()
      setSelectedTime(getDefaultTime())
      setOccasion("")
      setPaymentMethod("")
      setPaymentProofPreview("")
      setThemeImagePreview("")
      setShowConfirm(true)
    } catch (err) {
      console.error(err)
      alert(err.message || "Sorry, something went wrong while submitting your reservation. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelReservation = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return
    try {
      await reservationsApi.updateStatus(id, 'cancelled')
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))
    } catch (err) {
      console.error(err)
      alert("Failed to cancel reservation. Please try again.")
    }
  }

  const inputClass =
    "w-full bg-white rounded-md px-4 py-3.5 text-[#1d080f] placeholder:text-neutral-400 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"

  const lockedInputClass =
    "w-full bg-neutral-100 rounded-md px-4 py-3.5 text-[#1d080f] font-[Prata] cursor-not-allowed"

  return (
    <div className="bg-white text-[#1d080f]">
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-10 md:pt-14">
          <h1
            className="font-[Prata] font-bold text-xs md:text-xs text-[#1d080f]"
            style={{ WebkitTextStroke: '0.7px #1d080f', letterSpacing: '1.5px' }}
          >
            Have a Reservation Now!
          </h1>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}> </div>
      <div className="max-w-5xl mx-auto px-4 md:px-3 -mt-24 md:-mt-32 relative z-10 pb-16">
        <div className="bg-[#e6e1d8] rounded-xl shadow-xl p-6 md:p-10">

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
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setTab("table")}
                  className={`flex-1 py-4 rounded-xl text-base md:text-lg font-[Prata] font-bold transition-colors ${
                    tab === "table"
                      ? 'bg-[#1d080f] text-white'
                      : 'bg-neutral-200/70 text-[#1d080f] hover:bg-neutral-300/70'
                  }`}
                >
                  Table Reservation
                </button>
                <button
                  onClick={() => setTab("event")}
                  className={`flex-1 py-4 rounded-xl text-base md:text-lg font-[Prata] font-bold transition-colors ${
                    tab === "event"
                      ? 'bg-[#1d080f] text-white'
                      : 'bg-neutral-200/70 text-[#1d080f] hover:bg-neutral-300/70'
                  }`}
                >
                  Event Reservation
                </button>
                <button
                  onClick={() => setTab("history")}
                  className={`flex-1 py-4 rounded-xl text-base md:text-lg font-[Prata] font-bold transition-colors ${
                    tab === "history"
                      ? 'bg-[#1d080f] text-white'
                      : 'bg-neutral-200/70 text-[#1d080f] hover:bg-neutral-300/70'
                  }`}
                >
                  History
                </button>
              </div>

              {tab !== "history" && (
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
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

                  <form id="reservation-form" onSubmit={handleConfirm} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input value={user?.full_name || ''} readOnly className={lockedInputClass} />
                      <input value={user?.contact_number || ''} readOnly className={lockedInputClass} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input value={user?.email || ''} readOnly className={lockedInputClass} />
                      <WheelTimePicker value={selectedTime} onChange={setSelectedTime} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <select value={occasion} onChange={(e) => setOccasion(e.target.value)} required={tab === "event"} className={`${inputClass} appearance-none ${occasion ? 'text-[#1d080f]' : 'text-neutral-400'}`}>
                          <option value="" disabled className="text-neutral-400">Occasion{tab === "event" ? " *" : ""}</option>
                          <option className="text-[#1d080f]">Birthday</option>
                          <option className="text-[#1d080f]">Anniversary</option>
                          <option className="text-[#1d080f]">Wedding</option>
                          <option className="text-[#1d080f]">Business</option>
                          <option className="text-[#1d080f]">Casual</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                      </div>
                      <input name="persons" type="number" min="1" placeholder="Number of Pax *" required className={inputClass} />
                    </div>

                    {tab === "event" && (
                      <>
                        <input name="preference" placeholder="Theme Preference *" required className={inputClass} />

                        <div className="bg-white rounded-md p-4">
                          <label className="font-[Prata] text-sm text-neutral-600 block mb-2">
                            Theme Inspiration Photo (optional)
                          </label>
                          <label
                            htmlFor="theme-image-upload"
                            className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-md py-6 cursor-pointer hover:bg-neutral-50 transition"
                          >
                            <Upload size={16} className="text-neutral-400" />
                            <span className="font-[Prata] text-xs text-neutral-500">
                              {themeImagePreview ? "Change photo" : "Click to upload a photo"}
                            </span>
                          </label>
                          <input
                            id="theme-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleThemeImageChange}
                            className="hidden"
                          />
                          {themeImagePreview && (
                            <img
                              src={themeImagePreview}
                              alt="Theme preview"
                              className="mt-3 w-full max-h-40 object-cover rounded-md"
                            />
                          )}
                        </div>

                        <textarea name="note" placeholder="Note (optional)" className={`${inputClass} resize-none h-20`} />
                      </>
                    )}

                    <div className="bg-white rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-[Prata] text-sm text-neutral-600">Required Downpayment</span>
                        <span className="font-[Prata] font-bold text-lg text-[#1d080f]">
                          Php. {(tab === "event" ? DOWNPAYMENT.event : DOWNPAYMENT.table).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-[Prata] mb-4">
                        This amount will be deducted from your final bill.
                      </p>

                      <div className="relative">
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={`${inputClass} appearance-none ${paymentMethod ? 'text-[#1d080f]' : 'text-neutral-400'}`}>
                          <option value="" disabled className="text-neutral-400">Mode of Payment *</option>
                          <option className="text-[#1d080f]">Cash</option>
                          <option className="text-[#1d080f]">GCash</option>
                          <option className="text-[#1d080f]">Paymaya</option>
                          <option className="text-[#1d080f]">Bank Transfer</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                      </div>
                      {!paymentMethod && (
                        <p className="text-xs text-red-500 font-[Prata] mt-2">Please select a mode of payment.</p>
                      )}

                      {paymentMethod === "Cash" && (
                        <div className="mt-4 bg-[#f7f5f0] rounded-lg p-4">
                          <p className="text-xs font-[Prata] text-neutral-600 leading-relaxed">
                            Please pay your Php. {(tab === "event" ? DOWNPAYMENT.event : DOWNPAYMENT.table).toLocaleString()} downpayment in cash at the restaurant, then upload the photo of your receipt below.
                          </p>
                        </div>
                      )}

                      {paymentMethod && PAYMENT_ACCOUNTS[paymentMethod] && (
                        <div className="mt-4 bg-[#f7f5f0] rounded-lg p-4">
                          <p className="text-xs font-[Prata] text-neutral-600 mb-3">
                            Send your Php. {(tab === "event" ? DOWNPAYMENT.event : DOWNPAYMENT.table).toLocaleString()} downpayment to:
                          </p>

                          <div className="flex items-center gap-4">
                            {PAYMENT_ACCOUNTS[paymentMethod].qrPlaceholder && (
                              <div className="w-20 h-20 shrink-0 bg-white rounded-md border border-dashed border-neutral-300 flex items-center justify-center text-[9px] text-neutral-400 text-center font-[Prata] leading-tight">
                                QR Code
                              </div>
                            )}
                            <div className="text-xs font-[Prata]">
                              <div className="text-neutral-500">Account Name</div>
                              <div className="text-[#1d080f] font-bold mb-2">{PAYMENT_ACCOUNTS[paymentMethod].accountName}</div>
                              <div className="text-neutral-500">{paymentMethod === "Bank Transfer" ? "Account Number" : "Number"}</div>
                              <div className="text-[#1d080f] font-bold">{PAYMENT_ACCOUNTS[paymentMethod].accountNumber}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod && (
                        <div className="mt-4 border-t border-neutral-200 pt-4">
                          <label className="font-[Prata] text-sm text-neutral-600 block mb-2">
                            Proof of Payment *
                          </label>
                          <p className="text-xs text-neutral-400 font-[Prata] mb-3 leading-relaxed">
                            Upload a screenshot or photo of your payment receipt. The receptionist will verify this to confirm your reservation.
                          </p>
                          <label
                            htmlFor="payment-proof-upload"
                            className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-md py-6 cursor-pointer hover:bg-neutral-50 transition"
                          >
                            <Upload size={16} className="text-neutral-400" />
                            <span className="font-[Prata] text-xs text-neutral-500">
                              {paymentProofPreview ? "Change proof of payment" : "Click to upload proof of payment"}
                            </span>
                          </label>
                          <input
                            id="payment-proof-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePaymentProofChange}
                            className="hidden"
                          />
                          {paymentProofPreview ? (
                            <img
                              src={paymentProofPreview}
                              alt="Proof of payment preview"
                              className="mt-3 w-full max-h-48 object-contain rounded-md bg-neutral-50"
                            />
                          ) : (
                            <p className="text-xs text-red-500 font-[Prata] mt-2">Proof of payment is required.</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 mt-8 max-w-md">
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('reservation-form')?.reset()
                          setSelectedTime(getDefaultTime())
                          setOccasion("")
                          setPaymentMethod("")
                          setPaymentProofPreview("")
                          setThemeImagePreview("")
                        }}
                        className="flex-1 bg-[#c0392b] text-white font-[Prata] font-bold py-3.5 rounded-full hover:opacity-90 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="reservation-form"
                        disabled={submitting}
                        className="flex-1 bg-[#1d080f] text-white font-[Prata] font-bold py-3.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Reservation"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {tab === "history" && (
                <div>
                  {loadingReservations && (
                    <p className="text-neutral-500 text-center py-8 text-sm font-[Prata]">Loading...</p>
                  )}

                  {!loadingReservations && reservations.length === 0 && (
                    <p className="text-neutral-500 text-center py-8 text-sm font-[Prata]">
                      No reservations yet.
                    </p>
                  )}

                  {reservations.map((r) => {
                    const remainingDays = daysUntil(r.reservation_date)
                    const isClosed = r.status === 'cancelled' || r.status === 'completed' || r.status === 'no_show'
                    const pastCutoff = remainingDays !== null && remainingDays < CANCEL_CUTOFF_DAYS
                    const cancelDisabled = isClosed || pastCutoff

                    return (
                       <div key={r.id} className="bg-white rounded-xl p-6 mb-4 text-left">
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
                              <span>{r.email}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-neutral-400">Occasion</span>
                              <span>{r.occasion || '—'}</span>
                            </div>
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
                              <span>
                                {r.downpayment_amount ? `Php. ${Number(r.downpayment_amount).toLocaleString()} (${r.payment_status || 'Pending'})` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-neutral-400 mb-1">Status</span>
                              <StatusBadge status={r.status} />
                            </div>

                            <div>
                              <button
                                onClick={() => handleCancelReservation(r.id)}
                                disabled={cancelDisabled}
                                className="w-full bg-[#c0392b] text-white font-[Prata] font-bold py-3 rounded-full hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Cancel Reservation
                              </button>
                              {pastCutoff && !isClosed && (
                                <p className="text-[11px] text-neutral-500 font-[Prata] mt-2 text-center leading-relaxed">
                                  Cancellations must be made at least {CANCEL_CUTOFF_DAYS} days before your reservation date.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {r.payment_proof && (
                          <div className="mt-4">
                            <span className="block text-xs text-neutral-400 font-[Prata] mb-2">Proof of Payment</span>
                            <img
                              src={r.payment_proof}
                              alt="Proof of payment"
                              className="w-full max-h-48 object-contain rounded-md bg-neutral-50"
                            />
                          </div>
                        )}

                        {r.theme_image && (
                          <img
                            src={r.theme_image}
                            alt="Theme inspiration"
                            className="mt-4 w-full max-h-48 object-cover rounded-md"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
              Your proof of payment will be verified by our receptionist. <br /><br />
              <b>REMINDER:</b> Cancellations must be made at least 3 days before your reservation date.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservation