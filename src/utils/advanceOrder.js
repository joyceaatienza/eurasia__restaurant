// Remembers which reservation an advance order is for, from the Reservation page
// through the Menu and tray to checkout. sessionStorage, so it ends with the tab.
const KEY = 'eurasia_advance_order'

export function getAdvanceOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function setAdvanceOrder(reservation) {
  sessionStorage.setItem(KEY, JSON.stringify(reservation))
  // Lets the Navbar banner show up right away
  window.dispatchEvent(new Event('advance-order-change'))
}

export function clearAdvanceOrder() {
  sessionStorage.removeItem(KEY)
  window.dispatchEvent(new Event('advance-order-change'))
}

// "Nov 20, 2026 at 7:00 PM"
export function advanceOrderLabel(advance) {
  if (!advance) return ''
  const [y, m, d] = String(advance.date).split('-').map(Number)
  const day = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const [h, min] = String(advance.time).split(':').map(Number)
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(min || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  return `${day} at ${time}`
}