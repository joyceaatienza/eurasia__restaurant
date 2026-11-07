import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '../services/ordersApi'
import { reservationsApi } from '../services/reservationsApi'
import { useAuth } from '../context/AuthContext'

const POLL_MS = 15000
const MAX_ITEMS = 30

/* ------------------------------------------------------------------ */
/* Light copies for instant notification taps                          */
/* ------------------------------------------------------------------ */
// The full lists carry base64 photos and are slow to download. The bell saves
// a copy without the photos every time it checks, so the Order and Reservation
// pages can jump to a tapped item immediately while fresh data loads.
const ORDERS_CACHE_KEY = 'eurasia_my_orders'
const RESERVATIONS_CACHE_KEY = 'eurasia_my_reservations'

function readCache(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key))
  } catch {
    return null
  }
}

function writeCache(key, list) {
  try {
    sessionStorage.setItem(key, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save a copy for notifications:', e)
  }
}

// receipt_image becomes `true` so "has the customer paid?" checks still work
function lightOrders(orders) {
  return orders.map(({ receipt_image, discount_id_image, ...rest }) => ({
    ...rest,
    receipt_image: receipt_image ? true : null,
  }))
}

function lightReservations(reservations) {
  return reservations.map(({ payment_proof, theme_image, ...rest }) => rest)
}

export const readCachedOrders = () => readCache(ORDERS_CACHE_KEY)
export const readCachedReservations = () => readCache(RESERVATIONS_CACHE_KEY)
export const cacheOrders = (orders) => writeCache(ORDERS_CACHE_KEY, lightOrders(orders))
export const cacheReservations = (reservations) =>
  writeCache(RESERVATIONS_CACHE_KEY, lightReservations(reservations))

// Orders not yet settled count as the unpaid balance — no proof submitted yet,
// or a proof the cashier marked as failed (the customer has to send a new one)
function summarizeUnpaid(orders) {
  const unpaid = orders.filter(
    (o) =>
      String(o.status || '').toLowerCase() !== 'cancelled' &&
      (!o.receipt_image || String(o.payment_status || '').toLowerCase() === 'failed')
  )
  const latest = unpaid.reduce((max, o) => {
    const t = new Date(o.created_at).getTime()
    return isNaN(t) ? max : Math.max(max, t)
  }, 0)
  return {
    count: unpaid.length,
    total: unpaid.reduce((sum, o) => sum + Number(o.total || 0), 0),
    latestAt: latest ? new Date(latest).toISOString() : new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */
function fmtDate(value) {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = String(timeStr).split(':').map(Number)
  if (isNaN(h)) return ''
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
}

const peso = (n) => `Php. ${Number(n || 0).toLocaleString('en-US')}`

// The database mixes casing ('Verified', 'verified'), so compare in lowercase
const lower = (v) => String(v || '').toLowerCase()

// One notification per status change, so the bell rings again each time something moves
const ORDER_MESSAGES = {
  pending: { title: 'Order received', detail: 'The kitchen has your order', tone: 'info' },
  preparing: { title: 'Your order is being prepared', detail: 'The kitchen is cooking your food', tone: 'info' },
  ready: { title: 'Ready to Serve', detail: 'Your food will be brought to your table shortly', tone: 'success' },
  served: { title: 'Your order has been served', detail: 'Enjoy your meal!', tone: 'success' },
  completed: { title: 'Order completed', detail: 'Thank you for dining with us', tone: 'info' },
  cancelled: { title: 'Your order was cancelled', detail: 'Please ask our staff if you have questions', tone: 'error' },
}

const RESERVATION_MESSAGES = {
  pending: { title: 'Reservation received', detail: 'Waiting for the front desk to confirm', tone: 'info' },
  confirmed: { title: 'Reservation confirmed', detail: 'We look forward to seeing you', tone: 'success' },
  seated: { title: 'Welcome to Eurasia!', detail: "You've been seated", tone: 'success' },
  completed: { title: 'Thank you for dining with us', detail: 'We hope to see you again', tone: 'info' },
  cancelled: { title: 'Reservation cancelled', detail: 'This reservation is no longer active', tone: 'error' },
  no_show: { title: 'Reservation marked as no-show', detail: 'Please contact us if this is a mistake', tone: 'error' },
}

/* ------------------------------------------------------------------ */
/* Turn the customer's orders and reservations into notifications      */
/* ------------------------------------------------------------------ */
function buildNotifications(orders, reservations) {
  const list = []

  orders.forEach((o) => {
    const no = o.daily_number ?? o.id
    const at = o.updated_at ?? o.created_at
    const status = lower(o.status)
    const pay = lower(o.payment_status)

    // ---------- Food status ----------
    const om = ORDER_MESSAGES[status]
    if (om) {
      list.push({
        id: `order-${o.id}-${status}`,
        kind: 'order',
        tone: om.tone,
        title: om.title,
        detail: `Order #${no} · ${om.detail}`,
        // A new order shows when it was placed; later changes show when they happened
        at: status === 'pending' ? o.created_at : at,
        link: '/payment',
        target: { type: 'order', id: o.id },
      })
    }

    // ---------- Payment status ----------
    if (pay === 'verified') {
      list.push({
        id: `orderpay-${o.id}-verified`,
        kind: 'payment',
        tone: 'success',
        title: 'Payment verified',
        detail: `Order #${no} · ${peso(o.total)} · Thank you!`,
        at: o.verified_at ?? at,
        link: '/payment',
        target: { type: 'order', id: o.id },
      })
    } else if (pay === 'failed') {
      // Goes straight to Settle Bill so a new proof can be uploaded
      list.push({
        id: `orderpay-${o.id}-failed`,
        kind: 'payment',
        tone: 'error',
        title: 'Payment failed',
        detail: `Order #${no} · The cashier couldn't verify your proof. Tap to upload a new one.`,
        at,
        link: '/payment',
        target: { type: 'settle' },
      })
    } else if (o.receipt_image) {
      list.push({
        id: `orderpay-${o.id}-submitted`,
        kind: 'payment',
        tone: 'info',
        title: 'Payment proof submitted',
        detail: `Order #${no} · ${peso(o.total)} · Waiting for the cashier to verify`,
        at,
        link: '/payment',
        target: { type: 'order', id: o.id },
      })
    }
  })

  reservations.forEach((r) => {
    const when = `${fmtDate(r.reservation_date)}${r.reservation_time ? ` at ${fmtTime(r.reservation_time)}` : ''}`
    const at = r.updated_at ?? r.created_at
    const status = lower(r.status)
    const pay = lower(r.payment_status)

    // ---------- Reservation status ----------
    const rm = RESERVATION_MESSAGES[status]
    if (rm) {
      list.push({
        id: `reservation-${r.id}-${status}`,
        kind: 'reservation',
        tone: rm.tone,
        title: rm.title,
        detail: `${when} · ${r.party_size} pax · ${rm.detail}`,
        at: status === 'pending' ? r.created_at : at,
        link: '/reservation',
        target: { type: 'reservation', id: r.id },
      })
    }

    // ---------- Downpayment status ----------
    if (Number(r.downpayment_amount) > 0) {
      if (pay === 'verified') {
        list.push({
          id: `downpayment-${r.id}-verified`,
          kind: 'payment',
          tone: 'success',
          title: 'Downpayment verified',
          detail: `${peso(r.downpayment_amount)} · Reservation on ${when}`,
          at,
          link: '/reservation',
          target: { type: 'reservation', id: r.id },
        })
      } else if (pay === 'failed') {
        list.push({
          id: `downpayment-${r.id}-failed`,
          kind: 'payment',
          tone: 'error',
          title: 'Downpayment failed',
          detail: `Reservation on ${when} · Please check your payment or contact us`,
          at,
          link: '/reservation',
          target: { type: 'reservation', id: r.id },
        })
      } else {
        const isCash = lower(r.payment_method) === 'cash'
        list.push({
          id: `downpayment-${r.id}-pending`,
          kind: 'payment',
          tone: 'info',
          title: isCash ? 'Downpayment to pay in cash' : 'Downpayment submitted',
          detail: isCash
            ? `${peso(r.downpayment_amount)} · Pay at the restaurant to confirm your reservation on ${when}`
            : `${peso(r.downpayment_amount)} · Waiting for the cashier to verify`,
          at: r.created_at,
          link: '/reservation',
          target: { type: 'reservation', id: r.id },
        })
      }
    }
  })

  const sorted = list
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, MAX_ITEMS)

  // Pinned to the top while there's an unpaid bill. The id includes the
  // count and total, so a new unpaid order shows up as a new unread item.
  const unpaid = summarizeUnpaid(orders)
  if (unpaid.count > 0) {
    sorted.unshift({
      id: `balance-${unpaid.count}-${Math.round(unpaid.total)}`,
      kind: 'payment',
      tone: 'error',
      title: 'You have an unpaid bill',
      detail: `${peso(unpaid.total)} from ${unpaid.count} order${unpaid.count !== 1 ? 's' : ''} · Tap to settle`,
      at: unpaid.latestAt,
      link: '/payment',
      target: { type: 'settle' },
    })
  }

  return sorted
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */
export function useCustomerNotifications() {
  const { user, isAuthenticated } = useAuth()

  // Start from the saved copies so the bell has something to show right away
  const [notifications, setNotifications] = useState(() => {
    const orders = readCachedOrders()
    const reservations = readCachedReservations()
    return orders || reservations ? buildNotifications(orders || [], reservations || []) : []
  })

  // Unpaid balance for the reminder; `loaded` waits for fresh data so an
  // old saved copy never shows a bill that was already paid
  const [unpaid, setUnpaid] = useState({ count: 0, total: 0, loaded: false })

  // Read state is kept per account, so two people on one browser don't mix
  const userKey = user?.id ?? user?.email ?? 'guest'
  const readKey = `eurasia_customer_read_${userKey}`

  const [readIds, setReadIds] = useState([])
  useEffect(() => {
    try {
      setReadIds(JSON.parse(localStorage.getItem(readKey)) || [])
    } catch {
      setReadIds([])
    }
  }, [readKey])

  // getMine() returns only this customer's rows — the same lists the
  // Order and Reservation pages use, so every notification can be found there
  const load = useCallback(() => {
    if (!isAuthenticated || !user) return
    Promise.all([ordersApi.getMine(), reservationsApi.getMine()])
      .then(([orders, reservations]) => {
        setNotifications(buildNotifications(orders, reservations))
        setUnpaid({ ...summarizeUnpaid(orders), loaded: true })
        cacheOrders(orders)
        cacheReservations(reservations)
      })
      .catch((err) => console.error('Failed to load notifications:', err))
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnpaid({ count: 0, total: 0, loaded: false })
      return
    }
    load()
    // Skip polling while the tab is in the background
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [isAuthenticated, load])

  const markRead = useCallback(
    (ids) => {
      setReadIds((prev) => {
        const next = Array.from(new Set([...prev, ...ids]))
        try {
          localStorage.setItem(readKey, JSON.stringify(next))
        } catch (e) {
          console.error('Failed to save read notifications:', e)
        }
        return next
      })
    },
    [readKey]
  )

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  return {
    notifications,
    readIds,
    unreadCount,
    markRead,
    unpaidCount: unpaid.count,
    unpaidTotal: unpaid.total,
    unpaidLoaded: unpaid.loaded,
  }
}