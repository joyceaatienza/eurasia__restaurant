import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Check, X, Clock } from 'lucide-react'
import heroImage from '../assets/bgHero.jpg'

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]
const STORAGE_KEY = 'eurasia_reservations'

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

const FLOOR_TABLES = [
  { id: 'T13', x: 20,   y: 7.3,  w: 15.5, h: 11 },
  { id: 'T6',  x: 67.3, y: 7.3,  w: 15.7, h: 11 },
  { id: 'T14', x: 3.7,  y: 22.6, w: 16.2, h: 8   },
  { id: 'T5',  x: 81,   y: 22.6, w: 16.2, h: 8   },
  { id: 'T12', x: 33.7, y: 23,   w: 7,    h: 20  },
  { id: 'T7',  x: 58,   y: 23,   w: 7.2,  h: 20  },
  { id: 'T15', x: 3.7,  y: 38.4, w: 16.2, h: 7.7 },
  { id: 'T4',  x: 81,   y: 38.4, w: 16.2, h: 7.7 },
  { id: 'T11', x: 29.2, y: 49,   w: 16.5, h: 8.6 },
  { id: 'T8',  x: 54.1, y: 49,   w: 16.5, h: 8.6 },
  { id: 'T16', x: 2.5,  y: 55.3, w: 16.2, h: 9   },
  { id: 'T3',  x: 81,   y: 55.3, w: 16.2, h: 9   },
  { id: 'T10', x: 33.7, y: 61.8, w: 7,    h: 19.8 },
  { id: 'T9',  x: 58,   y: 61.8, w: 7.2,  h: 19.8 },
  { id: 'T17', x: 2.5,  y: 70,   w: 16.2, h: 8.6 },
  { id: 'T2',  x: 81,   y: 70,   w: 16.2, h: 8.6 },
]

/* --- WHEEL TIME PICKER COMPONENT --- */
function WheelColumn({ options, selected, onSelect }) {
  const containerRef = useRef(null)
  const isScrollingRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return
    const index = options.indexOf(selected)
    if (index !== -1) {
      containerRef.current.scrollTop = index * 40
    }
  }, [selected, options])

  const handleScroll = () => {
    if (!containerRef.current) return
    if (isScrollingRef.current) clearTimeout(isScrollingRef.current)

    isScrollingRef.current = setTimeout(() => {
      const scrollTop = containerRef.current.scrollTop
      const index = Math.round(scrollTop / 40)

      if (options[index] !== undefined && options[index] !== selected) {
        onSelect(options[index])
      }
    }, 50)
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[160px] overflow-y-auto relative text-center flex-1 cursor-grab active:cursor-grabbing select-none scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      <div style={{ height: '60px' }} className="shrink-0 pointer-events-none" />

      {options.map((option) => (
        <div
          key={option}
          onClick={() => {
            onSelect(option)
            const idx = options.indexOf(option)
            if (containerRef.current && idx !== -1) {
              containerRef.current.scrollTop = idx * 40
            }
          }}
          style={{ height: '40px', scrollSnapAlign: 'center' }}
          className="flex items-center justify-center transition-all font-[Prata]"
        >
          <span
            className={`transition-all ${
              selected === option
                ? 'text-[#1d080f] font-bold text-base opacity-100 scale-105'
                : 'text-neutral-400 opacity-40 hover:opacity-80 text-xs'
            }`}
          >
            {option}
          </span>
        </div>
      ))}

      <div style={{ height: '60px' }} className="shrink-0 pointer-events-none" />
    </div>
  )
}

function WheelTimePicker({ isWeekend, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
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

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  const period = ['AM', 'PM']

  const updateTime = (newHour, newMin, newAmpm) => {
    let h = parseInt(newHour, 10)
    if (newAmpm === 'PM' && h < 12) h += 12
    if (newAmpm === 'AM' && h === 12) h = 0
    const time24 = `${h.toString().padStart(2, '0')}:${newMin}`
    onChange(time24)
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

  const displayString = value
    ? `${current.hour}:${current.minute} ${current.ampm}`
    : ''

  return (
    <div className="relative w-full" ref={containerRef}>
      <input type="hidden" name="time" value={value || ''} required />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-md px-4 py-3.5 flex items-center justify-between text-left font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
      >
        <span className={value ? 'text-neutral-700 font-medium' : 'text-neutral-400'}>
          {displayString || 'Time *'}
        </span>
        <Clock size={16} className="text-neutral-400 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 bg-[#e6e1d8] rounded-xl shadow-xl border border-neutral-300/60 p-4">
          <div className="text-center font-[Prata] text-xs text-neutral-500 mb-2">
            Hours: {isWeekend ? '10:00 AM – 10:00 PM' : '11:00 AM – 10:00 PM'}
          </div>

          <div className="relative flex items-center justify-center bg-white/60 rounded-lg px-2 h-[160px] overflow-hidden">
            <div className="absolute top-[60px] left-4 right-4 h-[40px] border-t-2 border-b-2 border-[#1d080f]/25 pointer-events-none" />

            <WheelColumn
              options={hours}
              selected={current.hour}
              onSelect={(val) => updateTime(val, current.minute, current.ampm)}
            />

            <span className="font-[Prata] text-[#1d080f] font-bold text-lg px-1 pointer-events-none z-10">:</span>

            <WheelColumn
              options={minutes}
              selected={current.minute}
              onSelect={(val) => updateTime(current.hour, val, current.ampm)}
            />

            <WheelColumn
              options={period}
              selected={current.ampm}
              onSelect={(val) => updateTime(current.hour, current.minute, val)}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!value) updateTime('12', '00', 'PM')
              setIsOpen(false)
            }}
            className="w-full mt-3 bg-[#1d080f] text-white font-[Prata] text-xs py-2.5 rounded-md hover:opacity-90 transition font-bold"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

function FloorPlan({ selected, onSelect, unavailableTables = [] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="font-[Prata] font-bold text-sm mb-3 text-center">
        Tap a table to select it
      </div>
      <div className="relative w-full aspect-[401/521] bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
        {FLOOR_TABLES.map((t) => {
          const isUnavailable = unavailableTables.includes(t.id)

          return (
            <button
              key={t.id}
              type="button"
              disabled={isUnavailable}
              onClick={() => onSelect(t.id)}
              title={isUnavailable ? `${t.id} (Reserved)` : t.id}
              style={{
                position: 'absolute',
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: `${t.w}%`,
                height: `${t.h}%`,
              }}
              className={`rounded-md border-2 flex items-center justify-center text-xs font-[Prata] font-bold transition-colors ${
                isUnavailable
                  ? 'bg-neutral-200 border-neutral-300 text-neutral-400 cursor-not-allowed opacity-70'
                  : selected === t.id
                  ? 'bg-[#1d080f] border-[#1d080f] text-white'
                  : 'bg-white border-neutral-300 text-[#1d080f] hover:bg-neutral-50'
              }`}
            >
              {t.id}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="text-center text-sm font-[Prata] mt-3">
          Selected: <b>{selected}</b>
        </div>
      )}
    </div>
  )
}

function Reservation() {
  const [tab, setTab] = useState("table")
  
  // Set initial state to the user's actual present date
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())

  const [selectedTime, setSelectedTime] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [selectedTable, setSelectedTable] = useState("")

  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const currentDateString = `${MONTH_NAMES[viewDate.getMonth()]} ${selectedDay}, ${viewDate.getFullYear()}`

  const unavailableTables = useMemo(() => {
    if (!selectedTime) return []
    return reservations
      .filter((r) => r.date === currentDateString && r.time === selectedTime && r.preference)
      .map((r) => r.preference)
  }, [reservations, currentDateString, selectedTime])

  useEffect(() => {
    if (selectedTable && unavailableTables.includes(selectedTable)) {
      setSelectedTable("")
    }
  }, [unavailableTables, selectedTable])

  const cells = useMemo(
    () => buildCalendar(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  )

  const isWeekend = useMemo(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDay).getDay()
    return d === 0 || d === 6
  }, [viewDate, selectedDay])

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1))
  }

  const handleConfirm = (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const time = formData.get('time')

    if (!time) {
      alert("Please select a time.")
      return
    }

    const [hh, mm] = time.split(':').map(Number)
    const minutesSinceMidnight = hh * 60 + mm
    const minAllowed = (isWeekend ? 10 : 11) * 60
    const maxAllowed = 22 * 60

    if (minutesSinceMidnight < minAllowed || minutesSinceMidnight > maxAllowed) {
      alert(
        `Please choose a time between ${isWeekend ? '10:00 AM' : '11:00 AM'} and 10:00 PM.`
      )
      return
    }

    const newReservation = {
      id: Date.now(),
      date: currentDateString,
      name: formData.get('name'),
      contact: formData.get('contact'),
      email: formData.get('email'),
      time,
      occasion: formData.get('occasion'),
      persons: formData.get('persons'),
      preference: formData.get('preference') || selectedTable || '',
      note: formData.get('note') || '',
      type: tab,
    }

    const updated = [...reservations, newReservation]
    setReservations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    e.target.reset()
    setSelectedTable("")
    setSelectedTime("")
    setShowConfirm(true)
  }

  const handleCancelReservation = (id) => {
    const updated = reservations.filter((r) => r.id !== id)
    setReservations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const filteredReservations = reservations.filter(
    (r) =>
      r.contact?.includes(historyQuery) ||
      r.email?.toLowerCase().includes(historyQuery.toLowerCase())
  )

  const inputClass =
    "w-full bg-white rounded-md px-4 py-3.5 text-neutral-500 placeholder:text-neutral-400 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"

  return (
    <div className="bg-white text-[#1d080f]">
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-10 md:pt-14">
          <h1
            className="font-[Prata] font-bold text-base md:text-xl text-[#1d080f]"
            style={{ WebkitTextStroke: '0.7px #1d080f' }}
          >
            Have a Reservation Now!
          </h1>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ marginTop: '4rem' }}> </div>
      <div className="max-w-5xl mx-auto px-4 md:px-3 -mt-24 md:-mt-32 relative z-10 pb-16">
        <div className="bg-[#e6e1d8] rounded-xl shadow-xl p-6 md:p-10">
          {/* Tabs */}
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                {/* Calendar */}
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
                      {cells.map((c, i) => (
                        <div
                          key={i}
                          onClick={() => !c.muted && setSelectedDay(c.day)}
                          className={`py-1.5 rounded cursor-pointer ${
                            c.muted
                              ? 'text-neutral-300 cursor-default'
                              : c.day === selectedDay
                              ? 'bg-[#1d080f] text-white'
                              : 'hover:bg-neutral-100'
                          }`}
                        >
                          {c.day}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form id="reservation-form" onSubmit={handleConfirm} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input name="name" placeholder="Name *" required className={inputClass} />
                    <input name="contact" placeholder="Contact No. *" required className={inputClass} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input name="email" type="email" placeholder="Email Address *" required className={inputClass} />
                    <WheelTimePicker
                      isWeekend={isWeekend}
                      value={selectedTime}
                      onChange={setSelectedTime}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <select name="occasion" defaultValue="" className={`${inputClass} appearance-none`}>
                        <option value="" disabled>Occasion</option>
                        <option>Birthday</option>
                        <option>Anniversary</option>
                        <option>Business</option>
                        <option>Casual</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                    </div>
                    <input name="persons" type="number" min="1" placeholder="Number of persons *" required className={inputClass} />
                  </div>

                  {tab === "table" ? (
                    <>
                      <input type="hidden" name="preference" value={selectedTable} />
                      <FloorPlan
                        selected={selectedTable}
                        onSelect={setSelectedTable}
                        unavailableTables={unavailableTables}
                      />
                      {!selectedTable && (
                        <p className="text-xs text-red-500 font-[Prata]">Please select an available table above.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <input name="preference" placeholder="Theme Preference *" required className={inputClass} />
                      <textarea name="note" placeholder="Note (optional)" className={`${inputClass} resize-none h-20`} />
                    </>
                  )}
                </form>
              </div>

              <div className="flex gap-4 mt-8 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('reservation-form')?.reset()
                    setSelectedTable("")
                    setSelectedTime("")
                  }}
                  className="flex-1 bg-[#c0392b] text-white font-[Prata] font-bold py-3.5 rounded-full hover:opacity-90 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="reservation-form"
                  disabled={tab === "table" && !selectedTable}
                  className="flex-1 bg-[#1d080f] text-white font-[Prata] font-bold py-3.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Reservation
                </button>
              </div>
            </>
          )}

          {tab === "history" && (
            <div>
              <div className="font-[Prata] text-lg mb-4">Your Reservations</div>
              <input
                placeholder="Enter phone number or email address"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                className={`${inputClass} mb-6`}
              />

              {filteredReservations.length === 0 && (
                <p className="text-neutral-500 text-center py-8 text-sm font-[Prata]">
                  {historyQuery ? "No matching reservations found." : "No reservations yet."}
                </p>
              )}

              {filteredReservations.map((r) => (
                <div key={r.id} className="bg-white rounded-xl p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-[Prata]">
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="block text-xs text-neutral-400">Date</span>
                        <span>{r.date}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Name</span>
                        <span>{r.name}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Contact No.</span>
                        <span>{r.contact}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Email Address</span>
                        <span>{r.email}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Occasion</span>
                        <span>{r.occasion}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="block text-xs text-neutral-400">Time</span>
                        <span>{r.time}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Number of persons</span>
                        <span>{r.persons}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Table / Preference</span>
                        <span>{r.preference || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-neutral-400">Note</span>
                        <span>{r.note || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 max-w-md">
                    <button
                      onClick={() => handleCancelReservation(r.id)}
                      className="flex-1 bg-[#c0392b] text-white font-[Prata] font-bold py-3 rounded-full hover:opacity-90 transition"
                    >
                      Cancel Reservation
                    </button>
                    <button className="flex-1 bg-[#1d080f] text-white font-[Prata] font-bold py-3 rounded-full hover:opacity-90 transition">
                      Pay Reservation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
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
            <h3 className="font-[Prata] text-lg mb-3">Reservation Confirmed!</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              <b>REMINDER:</b> Cancellations must be made at least 3 days before your reservation date.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservation