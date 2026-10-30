import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import StaffHeader from "../components/StaffHeader";
import { ordersApi } from "../services/ordersApi";
import { Check, X, ChevronRight, Search } from "lucide-react";

const STATUS_MAP = {
  pending: 'Waiting',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Ready',
  completed: 'Ready',
  cancelled: 'Ready',
};
const REVERSE_STATUS_MAP = {
  Waiting: 'pending',
  Preparing: 'preparing',
  Ready: 'ready',
};
const POLL_MS = 8000;
const HIGHLIGHT_MS = 4000;
const MOBILE_QUERY = "(max-width: 767px)";

// Lets the standalone page size itself; inside the Owner shell the prop wins
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function normalizeOrder(o) {
  const createdAt = new Date(o.created_at);
  return {
    id: o.id,
    dailyNumber: o.daily_number,
    createdAt,
    customer: o.customer_name || 'Guest',
    total: Number(o.total),
    status: STATUS_MAP[o.status] || 'Waiting',
    // Kept so History can tell a cancelled order apart from one that was served
    cancelled: String(o.status || '').toLowerCase() === 'cancelled',
    // When the kitchen tapped "Mark as Ready" (saved by the backend as ready_at)
    readyAt: o.ready_at ? new Date(o.ready_at) : null,
    date: createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    items: (o.items || []).map((it) => ({
      id: it.id,
      qty: it.quantity,
      name: it.item_name,
      note: it.note || '',
      price: Number(it.price),
      checked: !!it.checked,
    })),
  };
}

// Uses the daily_number stored in the database (consistent across Kitchen, Payment, Cashier).
// Falls back to a computed per-day number for older orders that have no daily_number yet.
function assignDailyNumbers(orders) {
  const needsFallback = orders.some((o) => o.dailyNumber == null);
  if (!needsFallback) {
    return orders.map((o) => ({ ...o, displayNo: o.dailyNumber }));
  }

  const byTime = [...orders].sort((a, b) => a.createdAt - b.createdAt);
  const numberMap = {};
  byTime.forEach((o, index) => {
    numberMap[o.id] = index + 1;
  });
  return orders.map((o) => ({
    ...o,
    displayNo: o.dailyNumber != null ? o.dailyNumber : numberMap[o.id],
  }));
}

const peso = (n) =>
  `Php. ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// How many dishes in total, counting quantities ("3 dishes" for 2 sisig + 1 rice)
const dishCount = (order) => order.items.reduce((sum, it) => sum + Number(it.qty || 0), 0);

const timeLabel = (d) =>
  d && !isNaN(d.getTime())
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;

// Minutes between the order coming in and the kitchen marking it ready
const prepMinutes = (order) =>
  order.readyAt && !isNaN(order.readyAt.getTime())
    ? Math.max(0, Math.round((order.readyAt - order.createdAt) / 60000))
    : null;

// Matches the customer, the order number ("12" or "#12"), or any dish in the order
function orderMatches(order, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const num = q.replace(/^#/, '');
  return (
    (order.customer || '').toLowerCase().includes(q) ||
    String(order.displayNo ?? '') === num ||
    order.items.some((it) => (it.name || '').toLowerCase().includes(q))
  );
}

// Shown at the top of the kitchen page so the chef knows the flow
const KITCHEN_STEPS = [
  <>Tap <strong>Start Preparing</strong> when you begin cooking an order.</>,
  <>Tap each <strong>dish</strong> once it's cooked. A green check will appear.</>,
  <>When every dish is checked, tap <strong>Mark as Ready</strong>.</>,
];

/* ---------------------------------------------------------------- */
/* Order details — opened from History to see what the guest ordered */
/* ---------------------------------------------------------------- */
function OrderDetailsModal({ order, onClose }) {
  // Lock the page behind it and let Esc close it
  useEffect(() => {
    if (!order) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [order, onClose]);

  if (!order) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[200] sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[88vh] flex flex-col font-[Prata] text-left"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-xl text-[#1d080f]"
                style={{ WebkitTextStroke: "0.5px #1d080f" }}
              >
                Order #{order.displayNo}
              </h3>
              <span
                className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap ${
                  order.cancelled ? 'bg-[#f8d7da] text-[#842029]' : 'bg-[#d1e7dd] text-[#0f5132]'
                }`}
              >
                {order.cancelled ? 'Cancelled' : 'Ready'}
              </span>
            </div>
            <p className="text-sm text-[#1d080f] mt-1">{order.customer}</p>
            <p className="text-xs text-gray-600">Ordered: {order.date} · {order.time}</p>
            {!order.cancelled && (
              <p className="text-xs text-gray-600">
                Marked ready:{' '}
                {timeLabel(order.readyAt) ? (
                  <span className="text-[#296c39]">
                    {timeLabel(order.readyAt)}
                    {prepMinutes(order) != null && ` (${prepMinutes(order)} min after ordering)`}
                  </span>
                ) : (
                  <span className="italic">Not recorded</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-gray-500 hover:text-[#1d080f] p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dishes */}
        <div className="overflow-y-auto px-5 sm:px-6 py-4">
          <p className="text-xs text-gray-600 mb-3">
            {dishCount(order)} dish{dishCount(order) !== 1 ? 'es' : ''} ordered
          </p>

          {order.items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No dishes recorded for this order.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="shrink-0 min-w-[2rem] h-7 px-1.5 rounded-md bg-[#f0eff3] text-[#1d080f] text-sm flex items-center justify-center tabular-nums">
                      {item.qty}×
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-[#1d080f]">{item.name}</p>
                      {item.note && (
                        <p className="text-xs text-[#8a6228] mt-0.5">Note: {item.note}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-800 tabular-nums whitespace-nowrap">
                    {peso(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Total */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span
            className="text-lg text-[#1d080f] tabular-nums"
            style={{ WebkitTextStroke: "0.4px #1d080f" }}
          >
            {peso(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

// historyOnly: the Owner's History page shows just the History view from here,
// so it matches what the kitchen sees
export default function OrderQueue({ embedded = false, highlightTarget = null, isMobile: isMobileProp, historyOnly = false }) {
  const location = useLocation();
  const detectedMobile = useMediaQuery(MOBILE_QUERY);
  const isMobile = isMobileProp ?? detectedMobile;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const [view, setView] = useState(historyOnly ? "history" : "active");
  const [highlightId, setHighlightId] = useState(null);
  const highlightRef = useRef(null);
  // The History order whose dishes are being looked at
  const [detailsId, setDetailsId] = useState(null);
  // Filters whichever tab is open — Active Orders or History
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;
  // History keeps every finished order, not just today's, so it loads separately
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadOrders = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    return ordersApi.getAll({ today_only: 'true' })
      .then((data) => setOrders(assignDailyNumbers(data.map(normalizeOrder))))
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => { if (showSpinner) setLoading(false); });
  }, []);

  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  // All orders from every day — only fetched while the History tab is open,
  // so the Active Orders screen stays light
  const loadHistory = useCallback((showSpinner = false) => {
    if (showSpinner) setHistoryLoading(true);
    return ordersApi.getAll()
      .then((data) => {
        setHistoryOrders(assignDailyNumbers(data.map(normalizeOrder)));
        setHistoryLoaded(true);
      })
      .catch((err) => console.error('Failed to load order history:', err))
      .finally(() => { if (showSpinner) setHistoryLoading(false); });
  }, []);

  useEffect(() => {
    if (view !== "history") return;
    loadHistory(!historyLoaded);
    const interval = setInterval(() => loadHistory(), POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, loadHistory]);

  // New orders should land on the kitchen screen on their own
  useEffect(() => {
    const interval = setInterval(() => loadOrders(), POLL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // A notification click asks this page to surface one order. It arrives as a
  // prop inside the Owner shell, or through router state on the standalone page.
  useEffect(() => {
    if (historyOnly) return;
    const target = highlightTarget || location.state?.highlight;
    if (!target || target.type !== "order") return;
    setView("active");
    setHighlightId(target.id);
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightTarget, location.state]);

  // Scroll the highlighted card into view once it renders
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, orders]);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast({ message: "", tone }), 3000);
  };
  const showError = (message) => showToast(message, "error");

  const closeDetails = useCallback(() => setDetailsId(null), []);

  const handleToggleItem = async (orderId, itemId) => {
    try {
      const { checked } = await ordersApi.toggleItem(itemId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, items: order.items.map((it) => (it.id === itemId ? { ...it, checked } : it)) }
            : order
        )
      );
    } catch (err) {
      console.error(err);
      showError("Failed to update item. Please try again.");
    }
  };

  const handleStatusChange = async (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const nextStatus = order.status === 'Waiting' ? 'Preparing' : 'Ready';
    try {
      await ordersApi.updateStatus(orderId, REVERSE_STATUS_MAP[nextStatus]);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: nextStatus, ...(nextStatus === 'Ready' ? { readyAt: new Date() } : {}) }
            : o
        )
      );
      showToast(nextStatus === 'Preparing' ? `Order ${order.displayNo} is now preparing` : `Order ${order.displayNo} marked as ready`);
    } catch (err) {
      console.error(err);
      showError("Failed to update order status. Please try again.");
    }
  };

  const activeOrders = orders.filter(
    (order) => order.status !== 'Ready' && orderMatches(order, search)
  );
  // Every finished order from every day, newest first. Until the full history
  // arrives, today's finished orders show so the tab is never blank.
  const historySource = historyLoaded ? historyOrders : orders;
  const completedOrders = [...historySource]
    .filter((order) => order.status === 'Ready' && orderMatches(order, search))
    .sort((a, b) => b.createdAt - a.createdAt);

  // Looked up fresh each render, so the details follow the latest poll
  const detailsOrder =
    historyOrders.find((o) => o.id === detailsId) ||
    orders.find((o) => o.id === detailsId) ||
    null;

  const emptyClass =
    "bg-white rounded-xl p-8 sm:p-12 text-center text-gray-500 font-[Prata] text-sm shadow-sm border border-gray-100";

  return (
    <div className={`${historyOnly ? "" : "min-h-screen bg-[#f0eff3]"} font-[Prata] text-[#1d080f] text-left`}>
      {!embedded && <StaffHeader role="Kitchen" />}

      <main className="max-w-[1400px] mx-auto" style={{ padding: historyOnly ? 0 : isMobile ? 16 : 28 }}>
        {!historyOnly && (
        <h1
          className="font-[Prata] text-[#1d080f] text-left"
          style={{
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "clamp(26px, 6vw, 39px)",
            lineHeight: 1.15,
            WebkitTextStroke: "0.4px #1d080f",
          }}
        >
          Order Queue
        </h1>
        )}

        {/* Search by customer, order number, or dish */}
        <div className="relative w-full sm:max-w-md mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search customer, order #, or dish"
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-[Prata] text-[#1d080f] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
          />
          {isSearching && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1d080f] p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Inside the Owner shell, History lives on the Owner's own History page */}
        {!historyOnly && (
        <div className="overflow-x-auto mb-5 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 bg-white p-1 rounded-lg w-fit shadow-sm border border-gray-100">
            {(embedded
              ? [{ key: "active", label: "Active Orders" }]
              : [
                  { key: "active", label: "Active Orders" },
                  { key: "history", label: "History" },
                ]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-[Prata] transition whitespace-nowrap ${
                  view === t.key ? "bg-[#1d080f] text-white" : "text-[#1d080f] hover:bg-gray-50"
                }`}
              >
                {t.label}
                {/* While searching, each tab shows how many orders match */}
                {isSearching && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f5e79e] text-[#5e5113]">
                    {t.key === "active" ? activeOrders.length : completedOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {view === "active" && !loading && !isSearching && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-5 sm:mb-6">
            <p
              className="font-[Prata] text-sm sm:text-base text-[#1d080f] mb-3"
              style={{ WebkitTextStroke: "0.3px #1d080f" }}
            >
              How to use the order queue
            </p>
            <ol className="grid gap-3 sm:grid-cols-3 text-xs sm:text-sm text-gray-700 font-[Prata]">
              {KITCHEN_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#1d080f] text-white text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {view === "history" && !loading && completedOrders.length > 0 && (
          <p className="text-xs text-gray-600 mb-3 font-[Prata]">
            {completedOrders.length} finished order{completedOrders.length !== 1 ? 's' : ''}
            {historyLoaded ? ' from every day' : ' today (loading older orders...)'}.
            {' '}Tap an order to see the dishes the guest ordered.
          </p>
        )}

        {loading || (view === "history" && historyLoading && completedOrders.length === 0) ? (
          <div className={emptyClass}>{view === "history" ? "Loading order history..." : "Loading orders..."}</div>
        ) : (
          <>
            {view === "active" && (
              activeOrders.length === 0 ? (
                <div className={emptyClass}>
                  {isSearching ? `No active orders match "${search.trim()}".` : "No orders yet."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
                  {activeOrders.map((order) => {
                    const isHighlighted = order.id === highlightId;
                    return (
                      <div
                        key={order.id}
                        ref={isHighlighted ? highlightRef : null}
                        className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm flex flex-col justify-between text-left transition-all duration-500 ${
                          isHighlighted
                            ? 'border-2 border-[#f2c14e] ring-4 ring-[#f2c14e]/25'
                            : 'border border-gray-100'
                        }`}
                      >
                        <div>
                          {/* Order number, badge and total wrap instead of squashing */}
                          <div className="flex justify-between items-start gap-3 mb-1 flex-wrap">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <h2
                                className="font-[Prata] text-xl sm:text-2xl text-[#1d080f]"
                                style={{ WebkitTextStroke: "0.7px #1d080f" }}
                              >
                                Order {order.displayNo}
                              </h2>
                              {order.status === 'Preparing' && (
                                <span className="bg-[#f5e79e] text-[#5e5113] text-xs font-[Prata] px-3 py-1 rounded-md whitespace-nowrap">
                                  Preparing
                                </span>
                              )}
                              {order.status === 'Waiting' && (
                                <span className="bg-[#e2e2e2] text-[#555] text-xs font-[Prata] px-3 py-1 rounded-md whitespace-nowrap">
                                  Waiting
                                </span>
                              )}
                            </div>
                            <div
                              className="font-[Prata] text-lg sm:text-xl text-[#1d080f] whitespace-nowrap"
                              style={{ WebkitTextStroke: "0.5px #1d080f" }}
                            >
                              Php. {order.total?.toLocaleString?.() ?? order.total}
                            </div>
                          </div>

                          <div className="text-xs text-gray-700 mb-4 space-y-0.5 font-[Prata]">
                            <p>{order.customer}</p>
                            <p className="text-gray-600">{order.time}</p>
                          </div>

                          {(() => {
                            const canCheck = order.status === 'Preparing';
                            const doneCount = order.items.filter((it) => it.checked).length;
                            return (
                              <>
                                <p className="text-xs font-[Prata] mb-2 text-gray-600">
                                  {canCheck
                                    ? `${doneCount} of ${order.items.length} dishes cooked`
                                    : 'Tap "Start Preparing" to begin checking dishes'}
                                </p>
                                <div className="space-y-2 mb-5 sm:mb-6">
                                  {order.items.map((item) => (
                                    <button
                                      type="button"
                                      key={item.id}
                                      role="checkbox"
                                      aria-checked={item.checked}
                                      disabled={!canCheck}
                                      onClick={() => handleToggleItem(order.id, item.id)}
                                      className={`w-full flex justify-between items-center gap-3 text-sm px-3 py-2.5 rounded-lg border transition font-[Prata] text-left ${
                                        item.checked
                                          ? 'bg-[#e6f4ea] border-[#296c39]/40'
                                          : 'bg-white border-gray-200'
                                      } ${
                                        canCheck
                                          ? 'cursor-pointer hover:border-[#296c39] active:scale-[0.99]'
                                          : 'cursor-not-allowed opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        {/* The checkbox itself */}
                                        <span
                                          className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${
                                            item.checked
                                              ? 'bg-[#296c39] border-[#296c39]'
                                              : 'bg-white border-gray-400'
                                          }`}
                                        >
                                          {item.checked && <Check size={16} strokeWidth={3} color="#fff" />}
                                        </span>
                                        <span className={item.checked ? 'line-through text-gray-500' : 'text-[#1d080f]'}>
                                          ({item.qty}) {item.name}{' '}
                                          {item.note ? <span className="text-gray-700">- {item.note}</span> : null}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-800 tabular-nums shrink-0">
                                        Php. {item.price}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        <div className="mt-2">
                          {order.status === 'Preparing' && (() => {
                            const allChecked = order.items.every((item) => item.checked);
                            const doneCount = order.items.filter((item) => item.checked).length;
                            return (
                              <button
                                onClick={() => allChecked && handleStatusChange(order.id)}
                                disabled={!allChecked}
                                className={`w-full py-3 rounded-lg font-[Prata] text-sm transition ${
                                  allChecked
                                    ? 'bg-[#296c39] text-white hover:bg-[#1f5129] cursor-pointer'
                                    : 'bg-[#e0e0e0] text-[#777777] cursor-not-allowed'
                                }`}
                              >
                                {allChecked
                                  ? 'Mark as Ready'
                                  : `Check all dishes first (${doneCount}/${order.items.length})`}
                              </button>
                            );
                          })()}
                          {order.status === 'Waiting' && (
                            <button
                              onClick={() => handleStatusChange(order.id)}
                              className="w-full py-3 rounded-lg bg-[#1d080f] text-white font-[Prata] text-sm hover:bg-[#3a1420] transition"
                            >
                              Start Preparing
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {view === "history" && (
              completedOrders.length === 0 ? (
                <div className={emptyClass}>
                  {isSearching ? `No finished orders match "${search.trim()}".` : "No completed orders yet."}
                </div>
              ) : isMobile ? (
                /* Four columns is already tight at 375px, so each finished
                   order becomes a compact card instead */
                <div className="grid gap-3">
                  {completedOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setDetailsId(o.id)}
                      className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-[#1d080f]/30 active:scale-[0.99] transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <span
                          className="font-[Prata] text-base text-[#1d080f]"
                          style={{ WebkitTextStroke: "0.3px #1d080f" }}
                        >
                          Order #{o.displayNo}
                        </span>
                        <span className="font-[Prata] text-base text-[#1d080f] whitespace-nowrap">
                          Php. {o.total?.toLocaleString?.() ?? o.total}
                        </span>
                      </div>
                      <div className="text-sm text-[#1d080f]">{o.customer}</div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <span className="text-xs text-gray-600">
                          {o.date} · {o.time}
                          {timeLabel(o.readyAt) ? ` → Ready ${timeLabel(o.readyAt)}` : ''}
                          {' · '}{dishCount(o)} dish{dishCount(o) !== 1 ? 'es' : ''}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-[#8a6228] shrink-0">
                          View dishes <ChevronRight size={14} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 760 }}>
                    <thead>
                      <tr className="text-xs text-gray-600 border-b border-gray-100">
                        {["Order #", "Customer", "Dishes", "Total", "Ordered", "Marked Ready", ""].map((h, i) => (
                          <th key={i} className="px-6 py-4 font-[Prata] font-normal whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => setDetailsId(o.id)}
                          className="border-b border-gray-100 last:border-0 text-sm cursor-pointer hover:bg-[#faf8f5] transition"
                        >
                          <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{o.displayNo}</td>
                          <td className="px-6 py-4">{o.customer}</td>
                          <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                            {dishCount(o)} dish{dishCount(o) !== 1 ? 'es' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">Php. {o.total?.toLocaleString?.() ?? o.total}</td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{o.date} · {o.time}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {o.cancelled ? (
                              <span className="text-xs text-[#842029]">Cancelled</span>
                            ) : timeLabel(o.readyAt) ? (
                              <span className="text-[#296c39]">{timeLabel(o.readyAt)}</span>
                            ) : (
                              <span className="text-xs text-gray-500 italic">Not recorded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-0.5 text-xs text-[#8a6228] whitespace-nowrap">
                              View dishes <ChevronRight size={14} />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </main>

      <OrderDetailsModal order={detailsOrder} onClose={closeDetails} />

      {toast.message && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            left: isMobile ? 20 : "auto",
            background: toast.tone === "error" ? "#c0392b" : "#1d080f",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 300,
            maxWidth: isMobile ? "none" : 340,
          }}
          className="font-[Prata]"
        >
          <span
            style={{
              background: toast.tone === "error" ? "rgba(255,255,255,0.25)" : "#296c39",
              borderRadius: "50%",
              width: 20,
              height: 20,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            {toast.tone === "error" ? "!" : "✓"}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}