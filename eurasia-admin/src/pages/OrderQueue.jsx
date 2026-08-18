import React, { useState, useEffect } from 'react';
import StaffHeader from "../components/StaffHeader";
import { getOrders, toggleOrderItem, setOrderStatus } from "../utils/ordersStore";

export default function OrderQueue({ embedded = false }) {
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState("");
  const [view, setView] = useState("active"); // active | history

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const handleToggleItem = (orderId, itemId) => {
    setOrders(toggleOrderItem(orderId, itemId));
  };

  const handleStatusChange = (orderId) => {
    setOrders((prev) => {
      const order = prev.find((o) => o.id === orderId);
      if (!order) return prev;
      const nextStatus = order.status === 'Waiting' ? 'Preparing' : 'Ready';
      showToast(nextStatus === 'Preparing' ? `Order ${orderId} is now preparing` : `Order ${orderId} marked as ready`);
      return setOrderStatus(orderId, nextStatus);
    });
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

       {/* Tabs */}
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
                          Order {order.id}
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
                      <p>{order.customer || "Guest"} | {order.table}</p>
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
                      <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{o.id}</td>
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