import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import StaffHeader from "../components/StaffHeader";
import { ordersApi } from "../services/ordersApi";

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

export default function OrderQueue({ embedded = false, highlightTarget = null, isMobile: isMobileProp }) {
  const location = useLocation();
  const detectedMobile = useMediaQuery(MOBILE_QUERY);
  const isMobile = isMobileProp ?? detectedMobile;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const [view, setView] = useState("active");
  const [highlightId, setHighlightId] = useState(null);
  const highlightRef = useRef(null);

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

  // New orders should land on the kitchen screen on their own
  useEffect(() => {
    const interval = setInterval(() => loadOrders(), POLL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // A notification click asks this page to surface one order. It arrives as a
  // prop inside the Owner shell, or through router state on the standalone page.
  useEffect(() => {
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      showToast(nextStatus === 'Preparing' ? `Order ${order.displayNo} is now preparing` : `Order ${order.displayNo} marked as ready`);
    } catch (err) {
      console.error(err);
      showError("Failed to update order status. Please try again.");
    }
  };

  const activeOrders = orders.filter((order) => order.status !== 'Ready');
  const completedOrders = [...orders]
    .filter((order) => order.status === 'Ready')
    .sort((a, b) => b.createdAt - a.createdAt);

  const emptyClass =
    "bg-white rounded-xl p-8 sm:p-12 text-center text-gray-500 font-[Prata] text-sm shadow-sm border border-gray-100";

  return (
    <div className="min-h-screen bg-[#f0eff3] font-[Prata] text-[#1d080f] text-left">
      {!embedded && <StaffHeader role="Kitchen" />}

      <main className="max-w-[1400px] mx-auto" style={{ padding: isMobile ? 16 : 28 }}>
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
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={emptyClass}>Loading orders...</div>
        ) : (
          <>
            {view === "active" && (
              activeOrders.length === 0 ? (
                <div className={emptyClass}>No orders yet.</div>
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

                          <div className="space-y-1 sm:space-y-2 mb-5 sm:mb-6 my-4">
                            {order.items.map((item) => {
                              const canCheck = order.status === 'Preparing';
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => canCheck && handleToggleItem(order.id, item.id)}
                                  className={`flex justify-between items-start gap-3 text-sm p-2 sm:p-1 rounded transition font-[Prata] ${
                                    canCheck ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : 'cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <div className="flex items-start gap-2 min-w-0">
                                    <span className="text-xs text-gray-700 shrink-0 mt-0.5">
                                      [{item.checked ? 'X' : ' '}]
                                    </span>
                                    <span className={item.checked ? 'line-through text-gray-500' : 'text-[#1d080f]'}>
                                      ({item.qty}) {item.name} {item.note ? <span className="text-gray-700">- {item.note}</span> : null}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-800 tabular-nums shrink-0 mt-0.5">
                                    Php. {item.price}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-2">
                          {order.status === 'Preparing' && (() => {
                            const allChecked = order.items.every((item) => item.checked);
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
                                Mark as Ready
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
                <div className={emptyClass}>No completed orders yet.</div>
              ) : isMobile ? (
                /* Four columns is already tight at 375px, so each finished
                   order becomes a compact card instead */
                <div className="grid gap-3">
                  {completedOrders.map((o) => (
                    <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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
                      <div className="text-xs text-gray-600 mt-1">{o.date} · {o.time}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 560 }}>
                    <thead>
                      <tr className="text-xs text-gray-600 border-b border-gray-100">
                        {["Order #", "Customer", "Total", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((o) => (
                        <tr key={o.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{o.displayNo}</td>
                          <td className="px-6 py-4">{o.customer}</td>
                          <td className="px-6 py-4 whitespace-nowrap">Php. {o.total?.toLocaleString?.() ?? o.total}</td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{o.date} · {o.time}</td>
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