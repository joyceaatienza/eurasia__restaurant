import React, { useState, useEffect } from 'react';
import StaffHeader from "../components/StaffHeader";
import { getOrders, toggleOrderItem, setOrderStatus } from "../utils/ordersStore";

export default function OrderQueue({ embedded = false }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleToggleItem = (orderId, itemId) => {
    setOrders(toggleOrderItem(orderId, itemId));
  };

  const handleStatusChange = (orderId) => {
    setOrders((prev) => {
      const order = prev.find((o) => o.id === orderId);
      if (!order) return prev;
      const nextStatus = order.status === 'Waiting' ? 'Preparing' : 'Ready';
      return setOrderStatus(orderId, nextStatus);
    });
  };

  const activeOrders = orders.filter((order) => order.status !== 'Ready');

  return (
    <div className="min-h-screen bg-[#f0eff3] font-[Prata] text-[#1d080f] text-left">
      {!embedded && <StaffHeader />}

      <main className="max-w-[1400px] mx-auto" style={{ padding: 28 }}>
        <h1
          className="font-[Prata] text-[#1d080f] text-left"
          style={{ marginTop: 0, marginBottom: "16px", fontSize: 39, WebkitTextStroke: "0.4px #1d080f" }}
        >
          Order Queue
        </h1>

        {activeOrders.length === 0 ? (
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
                      {order.status === 'Ready' && (
                        <span className="bg-[#d1e7dd] text-[#0f5132] text-xs font-[Prata] px-3 py-1 rounded-md">
                          Ready
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
                  {order.status === 'Ready' && (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-[#e0e0e0] text-[#888888] font-[Prata] text-sm cursor-default"
                    >
                      Order Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}