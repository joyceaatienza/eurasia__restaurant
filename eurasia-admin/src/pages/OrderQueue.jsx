import React, { useState, useEffect, useCallback } from 'react';
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

function normalizeOrder(o) {
  const createdAt = new Date(o.created_at);
  return {
    id: o.id,
    dailyNumber: o.daily_number,
    createdAt,
    customer: o.customer || 'Guest',
    table: o.table_number,
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

export default function OrderQueue({ embedded = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [view, setView] = useState("active");

  const loadOrders = useCallback(() => {
    setLoading(true);
    ordersApi.getAll({ today_only: 'true' })
      .then((data) => setOrders(assignDailyNumbers(data.map(normalizeOrder))))
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

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
      alert("Failed to update item. Please try again.");
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
      alert("Failed to update order status. Please try again.");
    }
  };

  const activeOrders = orders.filter((order) => order.status !== 'Ready');
  const completedOrders = [...orders]
    .filter((order) => order.status === 'Ready')
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  return (
    <div className="min-h-screen bg-[#f0eff3] font-[Prata] text-[#1d080f] text-left">
      {!embedded && <StaffHeader role="Kitchen" />}

      <main className="max-w-[1400px] mx-auto" style={{ padding: 28 }}>
        <h1
          className="font-[Prata] text-[#1d080f] text-left"
          style={{ marginTop: 0, marginBottom: "16px", fontSize: 39, WebkitTextStroke: "0.4px #1d080f" }}
        >
          Order Queue
        </h1>

        <div className="flex gap-1.5 bg-white p-1 rounded-lg w-fit mb-6 shadow-sm border border-gray-100">
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
              className={`px-4 py-2 rounded-md text-sm font-[Prata] transition ${
                view === t.key ? "bg-[#1d080f] text-white" : "text-[#1d080f] hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 font-[Prata] text-sm shadow-sm border border-gray-100">
            Loading orders...
          </div>
        ) : (
          <>
            {view === "active" && (
              activeOrders.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center text-gray-400 font-[Prata] text-sm shadow-sm border border-gray-100">
                  No orders yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between text-left"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-3">
                            <h2
                              className="font-[Prata] text-2xl text-[#1d080f]"
                              style={{ WebkitTextStroke: "0.7px #1d080f" }}
                            >
                              Order {order.displayNo}
                            </h2>
                            {order.status === 'Preparing' && (
                              <span className="bg-[#f5e79e] text-[#5e5113] text-xs font-[Prata] px-3 py-1 rounded-md">
                                Preparing
                              </span>
                            )}
                            {order.status === 'Waiting' && (
                              <span className="bg-[#e2e2e2] text-[#555] text-xs font-[Prata] px-3 py-1 rounded-md">
                                Waiting
                              </span>
                            )}
                          </div>
                          <div
                            className="font-[Prata] text-xl text-[#1d080f]"
                            style={{ WebkitTextStroke: "0.5px #1d080f" }}
                          >
                            Php. {order.total?.toLocaleString?.() ?? order.total}
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 mb-4 space-y-0.5 font-[Prata]">
                          <p>{order.customer} | {order.table}</p>
                          <p className="text-gray-500">{order.time}</p>
                        </div>

                        <div className="space-y-2 mb-6 my-4">
                          {order.items.map((item) => {
                            const canCheck = order.status === 'Preparing';
                            return (
                              <div
                                key={item.id}
                                onClick={() => canCheck && handleToggleItem(order.id, item.id)}
                                className={`flex justify-between items-center text-sm p-1 rounded transition font-[Prata] ${
                                  canCheck ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">
                                    [{item.checked ? 'X' : ' '}]
                                  </span>
                                  <span className={item.checked ? 'line-through text-gray-400' : 'text-[#1d080f]'}>
                                    ({item.qty}) {item.name} {item.note && <span className="text-gray-600">- {item.note}</span>}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-800 tabular-nums">
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
                              className={`w-full py-2.5 rounded-lg font-[Prata] text-sm transition ${
                                allChecked
                                  ? 'bg-[#296c39] text-white hover:bg-[#1f5129] cursor-pointer'
                                  : 'bg-[#e0e0e0] text-[#888888] cursor-not-allowed'
                              }`}
                            >
                              Mark as Ready
                            </button>
                          );
                        })()}
                        {order.status === 'Waiting' && (
                          <button
                            onClick={() => handleStatusChange(order.id)}
                            className="w-full py-2.5 rounded-lg bg-[#1d080f] text-white font-[Prata] text-sm hover:bg-[#3a1420] transition"
                          >
                            Start Preparing
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {view === "history" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                {completedOrders.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 font-[Prata] text-sm">
                    No completed orders yet.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        {["Order #", "Customer", "Table", "Total", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((o) => (
                        <tr key={o.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{o.displayNo}</td>
                          <td className="px-6 py-4">{o.customer}</td>
                          <td className="px-6 py-4">{o.table}</td>
                          <td className="px-6 py-4">Php. {o.total?.toLocaleString?.() ?? o.total}</td>
                          <td className="px-6 py-4 text-gray-500">{o.date} · {o.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "#1d080f",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 100,
          }}
          className="font-[Prata]"
        >
          <span style={{ background: "#296c39", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
            ✓
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}